"""Pré-gera conteúdo com a IA para o fallback (PDF da CP5: "asset pré-gerado e integrado ao jogo").

- Perguntas: garante pelo menos POR_FATO perguntas em cache (tabela questions) para cada fato.
- Dicas do "Quem é": VERSOES variações validadas por jogador em api/dicas_cache.json.

Roda devagar de propósito, para caber na cota gratuita da Groq.
Uso: python scripts/aquece_cache.py   (lê o .env da raiz)
"""
import asyncio
import json
import sys
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv

RAIZ = Path(__file__).parent.parent
load_dotenv(RAIZ / ".env")
sys.path.insert(0, str(RAIZ))
import api.index as m  # noqa: E402  (precisa do .env carregado antes)

POR_FATO = 2
VERSOES = 2
PAUSA = 3  # segundos entre chamadas


async def perguntas():
    fatos = await m.sb("GET", "facts?select=id,categoria,dificuldade,fato")
    ja = Counter(q["fact_id"] for q in await m.sb("GET", "questions?select=fact_id&limit=10000"))
    for f in fatos:
        for _ in range(POR_FATO - ja[f["id"]]):
            ok = await m.gerar(f)  # gerar() já salva no cache quando a IA responde
            print(f"pergunta fato {f['id']:>3}: {'ok' if ok else 'falhou'}", flush=True)
            await asyncio.sleep(PAUSA)


async def dicas():
    arq = RAIZ / "api" / "dicas_cache.json"
    cache = json.loads(arq.read_text(encoding="utf8")) if arq.exists() else {}
    for j in m.JOGADORES.values():
        versoes = cache.setdefault(j["id"], [])
        for _ in range(4):  # algumas tentativas: a validação anti-alucinação descarta respostas ruins
            if len(versoes) >= VERSOES:
                break
            try:
                d = (await m.chamar_llm_dicas(j))["dicas"]
                if m.dicas_validas(d, j):
                    versoes.append([x.strip() for x in d])
            except Exception as e:  # noqa: BLE001
                print("  erro:", type(e).__name__)
            await asyncio.sleep(PAUSA)
        print(f"dicas {j['id']}: {len(versoes)} versões", flush=True)
        arq.write_text(json.dumps(cache, ensure_ascii=False, indent=1), encoding="utf8")


if __name__ == "__main__":
    asyncio.run(perguntas())
    asyncio.run(dicas())
