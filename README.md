# ⚽ Camisa 10: A Trilha do Craque — MVP (CP5)

Quiz de futebol com progressão estilo Duolingo, **PvP online** estilo Kahoot e **modo sobrevivência**, com perguntas geradas em tempo real por IA (LLM de pesos abertos: Qwen 3.8 via Groq, ou Llama/Qwen local via Ollama) a partir de uma base de fatos curada (RAG).

🎮 **Jogar online:** `https://SEU-PROJETO.vercel.app` · 🎬 **Vídeo:** `LINK_DO_VIDEO` · 📄 **Relatório CP5:** [docs/RELATORIO_CP5.md](docs/RELATORIO_CP5.md)

Grupo: Vitor Soares Gonçalves (RM 566181) · Pietro Boroto (RM 562407)

## Arquitetura

```
React (Vite) ──/api──► FastAPI (Vercel Python) ──► Qwen 3.8 27B (Groq)  ou  Llama 3.2 / Qwen 2.5 (Ollama local)
     │                        │
     │                        └──► Supabase Postgres: facts (RAG) · questions (cache/fallback) · rooms
     └── supabase-js ──► scores (ranking) · room_results + Realtime (lobby e placar PvP)
```

1. O jogador escolhe categoria/dificuldade → o backend **recupera fatos** filtrados no Supabase.
2. Monta o prompt (fato + formato + nível) e chama o **LLM em JSON mode**.
3. Valida a resposta com **Pydantic** (4 alternativas distintas, resposta presente nelas); se inválida, tenta de novo.
4. Embaralha as alternativas e **salva no cache**. Se o LLM estiver fora, serve perguntas do cache (selo 📦 no jogo).

| IA generativa | Onde aparece no jogo |
|---|---|
| **Texto** — Qwen 3.8 27B (Groq) / Llama 3.2 ou Qwen 2.5 (Ollama) | Toda pergunta, alternativa e explicação (selo 🤖 "Gerada agora pela IA") |
| **Imagem** — Google Gemini (assets da CP4) | Mascote (menu, gameplay, resultado) e fundo de estádio de todas as telas |

## Mecânicas
1. **Trilha de progressão** — 4 blocos × 3 níveis; acerte 3/5 para liberar a próxima fase.
2. **Filtros** — categoria, dificuldade e modo antes da partida.
3. **PvP online** — sala com código de 4 letras, mesmo lote de perguntas, placar ao vivo.
4. **Sobrevivência** — 20 s por pergunta, dificuldade sobe a cada 3 acertos, acaba no 1º erro.
5. **Sequência (streak)** e **pontuação por rapidez** + **ranking global**.

## Como rodar localmente

Pré-requisitos: Node 20+, Python 3.12+, conta no Supabase e chave da Groq (grátis em console.groq.com) **ou** Ollama.

```bash
# 1. Banco: no Supabase > SQL Editor, rode supabase/schema.sql e depois supabase/seed.sql
# 2. Variáveis
cp .env.example .env        # preencha as chaves
# 3. Dependências
npm install
pip install -r requirements-dev.txt
# 4. Rodar (dois terminais)
npm run api                 # FastAPI em :8000
npm run dev                 # jogo em http://localhost:5173
```

**Modo 100% local (arquitetura da CP4):** `ollama pull llama3.2:3b` e no `.env` use
`LLM_BASE_URL=http://localhost:11434/v1`, `LLM_MODEL=llama3.2:3b`, `LLM_TIMEOUT=120`.

## Testes
```bash
npm test     # 6 testes de mecânicas (node --test) + 9 do motor de IA (pytest)
```

## Deploy (Vercel)
Importe o repositório na Vercel e cadastre as variáveis do `.env.example` em *Settings → Environment Variables*. O `vercel.json` encaminha `/api/*` para o FastAPI.

## Estrutura
```
api/index.py        backend: RAG + LLM + validação + fallback + salas PvP
src/App.jsx         telas: menu, filtros, trilha, resultado, ranking
src/Quiz.jsx        tela de gameplay (HUD, timer, prefetch)
src/Pvp.jsx         lobby/placar PvP com Supabase Realtime
src/logic.js        regras do jogo (puras, testadas)
supabase/           schema (RLS + Realtime) e base de fatos curada
scripts/            pós-processamento dos assets do Gemini
tests/              testes automatizados
docs/               relatório CP5 e mockups da CP4
```
