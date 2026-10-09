"""Camisa 10 — backend (FastAPI).

Pipeline (CP4, seção 5): base de fatos (Supabase) -> recuperação por categoria/dificuldade
-> monta prompt (fato + formato + nível) -> LLM Llama (Groq ou Ollama, API compatível com OpenAI)
-> valida JSON com Pydantic -> devolve ao jogo. Se o LLM falhar, usa perguntas já geradas (cache).
"""
import asyncio
import json
import os
import random
import string

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, ValidationError, model_validator

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")
LLM_TIMEOUT = float(os.getenv("LLM_TIMEOUT", "20"))  # Ollama em CPU precisa de mais (ex.: 120)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

CATEGORIAS = {"regras", "historia", "craques", "estatisticas"}
VF = ["Verdadeiro", "Falso"]

# Mesmo prompt testado na CP4 (seção 2.1), com regras extras que a prática mostrou necessárias.
PROMPT_SISTEMA = """Você é um gerador de dinâmicas de quiz de futebol. Você recebe um FATO verificado \
e deve transformar esse fato numa pergunta de quiz, no FORMATO pedido, sem inventar nenhuma \
informação além do fato fornecido. Escreva em português do Brasil.
Regras:
- multipla_escolha: exatamente 4 alternativas curtas e diferentes entre si, só 1 correta, distratores plausíveis.
- verdadeiro_falso: alternativas ["Verdadeiro","Falso"]; você pode afirmar o fato ou uma versão alterada dele.
- resposta_correta deve ser idêntica a uma das alternativas.
- DIFICULDADE 1 = pergunta direta; 3 = exige detalhe (ano, número, nome).
Responda SOMENTE em JSON: {"pergunta": str, "alternativas": [str], "resposta_correta": str, "explicacao": str}"""


class Pergunta(BaseModel):
    pergunta: str = Field(min_length=8)
    alternativas: list[str]
    resposta_correta: str
    explicacao: str = ""

    @model_validator(mode="after")
    def coerente(self):
        alts = [a.strip() for a in self.alternativas]
        if len(alts) not in (2, 4) or len(set(a.lower() for a in alts)) != len(alts):
            raise ValueError("alternativas devem ser 2 ou 4 e distintas")
        certa = next((a for a in alts if a.lower() == self.resposta_correta.strip().lower()), None)
        if certa is None:
            raise ValueError("resposta_correta não está nas alternativas")
        self.alternativas, self.resposta_correta = alts, certa
        return self


def normalizar(bruto: dict, formato: str) -> Pergunta:
    """Valida a saída do LLM. Em V/F o modelo às vezes omite as alternativas (visto na CP4)."""
    if formato == "verdadeiro_falso":
        bruto["alternativas"] = VF
    p = Pergunta.model_validate(bruto)
    if formato == "multipla_escolha":
        if len(p.alternativas) != 4:
            raise ValueError("múltipla escolha precisa de 4 alternativas")
        random.shuffle(p.alternativas)  # o Llama quase sempre põe a correta em primeiro
    return p


async def chamar_llm(fato: str, formato: str, dificuldade: int) -> dict:
    usuario = f"FATO: {fato}\nFORMATO: {formato}\nDIFICULDADE: {dificuldade}"
    async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as c:
        r = await c.post(
            f"{LLM_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {LLM_API_KEY or 'ollama'}"},  # Ollama ignora a chave, mas header vazio é inválido
            json={
                "model": LLM_MODEL,
                "temperature": 0.7,
                "response_format": {"type": "json_object"},  # JSON mode (Groq e Ollama)
                "messages": [{"role": "system", "content": PROMPT_SISTEMA}, {"role": "user", "content": usuario}],
            },
        )
        r.raise_for_status()
        return json.loads(r.json()["choices"][0]["message"]["content"])


async def sb(metodo: str, caminho: str, **kw):
    """Chamada mínima ao PostgREST do Supabase com a service key (só no servidor)."""
    h = {"apikey": SUPABASE_SERVICE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}"}
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.request(metodo, f"{SUPABASE_URL}/rest/v1/{caminho}", headers=h, **kw)
        r.raise_for_status()
        return r.json() if r.content else None


async def gerar(fact: dict) -> dict | None:
    """Gera 1 pergunta a partir de 1 fato. 2 tentativas no LLM; depois cai para o cache."""
    formato = "verdadeiro_falso" if random.random() < (0.5 if fact["dificuldade"] == 1 else 0.2) else "multipla_escolha"
    for _ in range(2):
        try:
            p = normalizar(await chamar_llm(fact["fato"], formato, fact["dificuldade"]), formato)
            payload = p.model_dump()
            try:
                await sb("POST", "questions", json={"fact_id": fact["id"], "formato": formato, "payload": payload})
            except httpx.HTTPError:
                pass  # cache é best-effort; a pergunta já foi gerada
            return {**payload, "fact_id": fact["id"], "fonte": "ia"}
        except (httpx.HTTPError, ValueError, ValidationError, KeyError, json.JSONDecodeError):
            continue
    return None


async def do_cache(fact_ids: list[int], n: int) -> list[dict]:
    ids = ",".join(map(str, fact_ids))
    linhas = await sb("GET", f"questions?select=fact_id,payload&fact_id=in.({ids})&limit=200") or []
    random.shuffle(linhas)
    vistos, out = set(), []
    for l in linhas:
        if l["fact_id"] not in vistos:
            vistos.add(l["fact_id"])
            p = dict(l["payload"])
            random.shuffle(p["alternativas"])
            out.append({**p, "fact_id": l["fact_id"], "fonte": "cache"})
    return out[:n]


async def montar_lote(categoria: str | None, dificuldade: int, n: int, excluir: list[int]) -> list[dict]:
    filtro = f"&categoria=eq.{categoria}" if categoria else ""
    fatos = await sb("GET", f"facts?select=id,categoria,dificuldade,fato&dificuldade=eq.{dificuldade}{filtro}")
    if not fatos:
        raise HTTPException(404, "Nenhum fato para esse filtro")
    pool = [f for f in fatos if f["id"] not in excluir] or fatos  # acabou o pool? recicla
    escolhidos = random.sample(pool, min(n, len(pool)))
    geradas = [q for q in await asyncio.gather(*(gerar(f) for f in escolhidos)) if q]
    if len(geradas) < len(escolhidos):  # fallback: IA indisponível ou JSON inválido
        usados = {q["fact_id"] for q in geradas}
        geradas += await do_cache([f["id"] for f in pool if f["id"] not in usados], len(escolhidos) - len(geradas))
    if not geradas:
        raise HTTPException(503, "IA indisponível e sem perguntas em cache")
    return geradas


app = FastAPI(title="Camisa 10 API")


class PedidoPerguntas(BaseModel):
    categoria: str | None = None  # None = todas
    dificuldade: int = Field(2, ge=1, le=3)
    quantidade: int = Field(1, ge=1, le=10)
    excluir: list[int] = []

    @model_validator(mode="after")
    def cat_valida(self):
        if self.categoria is not None and self.categoria not in CATEGORIAS:
            raise ValueError("categoria inválida")
        return self


@app.post("/api/perguntas")
async def perguntas(req: PedidoPerguntas):
    return await montar_lote(req.categoria, req.dificuldade, req.quantidade, req.excluir)


@app.post("/api/salas")
async def criar_sala(req: PedidoPerguntas):
    lote = await montar_lote(req.categoria, req.dificuldade, 5, [])
    for _ in range(5):
        code = "".join(random.choices(string.ascii_uppercase.replace("O", "") + "23456789", k=4))
        try:
            await sb("POST", "rooms", json={"code": code, "categoria": req.categoria,
                                            "dificuldade": req.dificuldade, "questions": lote})
            return {"code": code}
        except httpx.HTTPStatusError as e:
            if e.response.status_code != 409:  # 409 = código repetido, tenta outro
                raise
    raise HTTPException(500, "Não foi possível criar a sala")


@app.get("/api/saude")
async def saude():
    return {"ok": True, "modelo": LLM_MODEL, "llm": LLM_BASE_URL.split("/")[2]}
