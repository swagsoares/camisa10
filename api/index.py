"""Camisa 10 — backend (FastAPI).

Pipeline (CP4, seção 5): base de fatos (Supabase) -> recuperação por categoria/dificuldade
-> monta prompt (fato + formato + nível) -> LLM de pesos abertos (Groq ou Ollama, API compatível com OpenAI)
-> valida JSON com Pydantic -> devolve ao jogo. Se o LLM falhar, usa perguntas já geradas (cache).
"""
import asyncio
import json
import os
import random
import re
import string
import unicodedata
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, ValidationError, model_validator

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
# Lista separada por vírgula: o 1º é o principal; os outros são reserva quando o anterior falha (ex.: 429 por cota).
LLM_MODELS = [m.strip() for m in os.getenv("LLM_MODEL", "qwen/qwen3.8-27b,openai/gpt-oss-20b").split(",") if m.strip()]
LLM_MODEL = LLM_MODELS[0]
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
- As 4 alternativas devem ser do MESMO TIPO e responder diretamente à pergunta (ex.: 4 anos, 4 países, 4 jogadores)
  e ter tamanho parecido: a correta não pode ser a mais longa nem a mais detalhada.
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
        random.shuffle(p.alternativas)  # LLMs tendem a pôr a correta em primeiro (visto na CP4)
    return p


async def llm_json(sistema: str, usuario: str, max_tokens: int, temperatura: float = 0.7) -> dict:
    """Chama o LLM em JSON mode, passando para o próximo modelo da lista se um falhar."""
    erro = None
    async with httpx.AsyncClient(timeout=LLM_TIMEOUT) as c:
        for modelo in LLM_MODELS:
            corpo = {
                "model": modelo,
                "temperature": temperatura,
                "max_tokens": max_tokens,  # sem isso a Groq reserva tokens demais e estoura a cota por minuto
                "response_format": {"type": "json_object"},  # JSON mode (Groq e Ollama)
                "messages": [{"role": "system", "content": sistema}, {"role": "user", "content": usuario}],
            }
            if "gpt-oss" in modelo:
                corpo["reasoning_effort"] = "low"  # modelo de raciocínio: pensa pouco, responde rápido
            try:
                r = await c.post(f"{LLM_BASE_URL}/chat/completions", json=corpo,
                                 headers={"Authorization": f"Bearer {LLM_API_KEY or 'ollama'}"})  # header vazio é inválido
                r.raise_for_status()
                return json.loads(r.json()["choices"][0]["message"]["content"])
            except (httpx.HTTPError, KeyError, json.JSONDecodeError) as e:
                erro = e
    raise erro


async def chamar_llm(fato: str, formato: str, dificuldade: int) -> dict:
    return await llm_json(PROMPT_SISTEMA, f"FATO: {fato}\nFORMATO: {formato}\nDIFICULDADE: {dificuldade}", 600)


async def sb(metodo: str, caminho: str, **kw):
    """Chamada mínima ao PostgREST do Supabase com a service key (só no servidor)."""
    h = {"apikey": SUPABASE_SERVICE_KEY}
    if not SUPABASE_SERVICE_KEY.startswith("sb_"):  # chaves antigas (JWT) também vão no Authorization
        h["Authorization"] = f"Bearer {SUPABASE_SERVICE_KEY}"
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


# ---------- Modo "Quem é esse jogador?" ----------
JOGADORES = {j["id"]: j for j in json.loads((Path(__file__).parent / "jogadores.json").read_text(encoding="utf8"))}
_cache = Path(__file__).parent / "dicas_cache.json"
DICAS_CACHE = json.loads(_cache.read_text(encoding="utf8")) if _cache.exists() else {}

PROMPT_DICAS = """Você é um narrador de futebol brasileiro animado apresentando o desafio "Quem é esse jogador?".
Reescreva cada PISTA como uma dica curta e misteriosa, na mesma ordem (da mais difícil para a mais fácil).
Regras:
- Só mude o ESTILO. Não acrescente nenhum fato, número, título, ano ou qualificação ("bi", "tri",
  "consecutivo", "histórico") que não esteja escrito na pista.
- Escreva números em algarismos, exatamente como na pista.
- NUNCA escreva o nome ou sobrenome do jogador. Máximo de 25 palavras por dica. Português do Brasil.
Responda SOMENTE em JSON: {"dicas": [str, str, str, str, str]}"""

NUMEROS = re.compile(r"\d+")


def sem_acento(t: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", t.lower()) if unicodedata.category(c) != "Mn")


def revela_nome(texto: str, jogador: dict) -> bool:
    """True se o texto entrega o jogador (nome ou sobrenome como palavra inteira).
    O apelido pode aparecer: ele é a última dica (a mais fácil) de propósito."""
    alvo = f" {re.sub(r'[^a-z0-9]+', ' ', sem_acento(texto))} "
    nomes = {jogador["nome"], *jogador["nome"].split()}
    return any(f" {sem_acento(n)} " in alvo for n in nomes if len(n) > 2)


async def chamar_llm_dicas(jogador: dict) -> list[str]:
    pistas = "\n".join(f"{i + 1}. {p}" for i, p in enumerate(jogador["pistas"]))
    usuario = f"JOGADOR (segredo, não revele): {jogador['nome']}\nPISTAS:\n{pistas}"
    return (await llm_json(PROMPT_DICAS, usuario, 700, 0.5))["dicas"]


def dicas_validas(dicas, jogador: dict) -> bool:
    """Barra alucinação detectável: toda dica precisa existir, não revelar o nome
    e não citar números que não estão na pista original (ex.: anos ou placares inventados)."""
    return (isinstance(dicas, list) and len(dicas) == 5
            and all(isinstance(d, str) and d.strip() for d in dicas)
            and not any(revela_nome(d, jogador) for d in dicas)
            and all(set(NUMEROS.findall(d)) <= set(NUMEROS.findall(p)) for d, p in zip(dicas, jogador["pistas"])))


async def gerar_dicas(jogador: dict) -> dict:
    for _ in range(2):
        try:
            dicas = await chamar_llm_dicas(jogador)
            if dicas_validas(dicas, jogador):
                return {"dicas": [d.strip() for d in dicas], "fonte": "ia"}
        except (httpx.HTTPError, ValueError, KeyError, TypeError, json.JSONDecodeError):
            pass
    if DICAS_CACHE.get(jogador["id"]):  # fallback 1: dicas geradas pela IA antes (scripts/aquece_cache.py)
        return {"dicas": random.choice(DICAS_CACHE[jogador["id"]]), "fonte": "cache"}
    return {"dicas": jogador["pistas"], "fonte": "curadas"}  # fallback 2: pistas escritas pelo grupo


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


class PedidoDicas(BaseModel):
    jogador: str


@app.post("/api/dicas")
async def dicas(req: PedidoDicas):
    if req.jogador not in JOGADORES:
        raise HTTPException(404, "Jogador desconhecido")
    return await gerar_dicas(JOGADORES[req.jogador])


@app.get("/api/saude")
async def saude():
    """Também é o keep-alive: a Vercel chama 1x/dia (vercel.json > crons) e a consulta ao banco
    impede o Supabase gratuito de pausar o projeto por inatividade (7 dias)."""
    try:
        await sb("GET", "facts?select=id&limit=1")
        banco = "ok"
    except httpx.HTTPError:
        banco = "fora"
    return {"ok": banco == "ok", "banco": banco, "modelos": LLM_MODELS, "llm": LLM_BASE_URL.split("/")[2]}
