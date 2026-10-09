# ⚽ Camisa 10: A Trilha do Craque — MVP (CP5)

Quiz de futebol com progressão estilo Duolingo, **PvP online** estilo Kahoot, **modo sobrevivência**, **"Quem é esse jogador?"** e **álbum de figurinhas**, com perguntas geradas em tempo real por IA (LLM de pesos abertos: Qwen 3.8 via Groq, ou Llama/Qwen local via Ollama) a partir de uma base de fatos curada (RAG).

📦 **Repositório:** https://github.com/swagsoares/camisa10 · 🎮 **Jogar online:** `https://SEU-PROJETO.vercel.app` · 🎬 **Vídeo:** `LINK_DO_VIDEO` · 📄 **Relatório CP5:** [docs/RELATORIO_CP5.md](docs/RELATORIO_CP5.md)

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
| **Texto** — mesmo LLM, narrando dicas | Dicas do "Quem é esse jogador?" reescritas pela IA a partir das pistas curadas (selo 🤖) |
| **Imagem** — Google Gemini (assets da CP4) | Mascote (menu, gameplay, resultado), fundo de estádio de todas as telas e caricaturas do "Quem é" |

## Mecânicas
1. **Trilha de progressão** — 4 blocos × 3 níveis; acerte 3/5 para liberar a próxima fase.
2. **Filtros** — categoria, dificuldade e modo antes da partida.
3. **PvP online** — sala com código de 4 letras, mesmo lote de perguntas, placar ao vivo.
4. **Sobrevivência** — 20 s por pergunta, dificuldade sobe a cada 3 acertos, acaba no 1º erro.
5. **Sequência (streak)** e **pontuação por rapidez** + **ranking global**.
6. **Quem é esse jogador?** — caricatura (Gemini) + foto real que começa borrada e clareia a cada chute errado + 5 dicas da IA; vale menos pontos a cada erro.
7. **Álbum de figurinhas** — 24 craques; todos os modos dão pacotinhos (mais figurinhas nos níveis altos da campanha, para o vencedor do PvP etc.), com repetidas e figurinhas ✨ brilhantes.

**Robustez da IA:** lista de modelos com reserva (`LLM_MODEL=principal,reserva`): se a cota da Groq estoura (HTTP 429), tenta o próximo modelo; se todos falham, usa o cache. As dicas passam por validação anti-alucinação (não podem citar o nome nem números que não estão na pista).

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
npm test     # 10 testes de mecânicas (node --test) + 13 do motor de IA (pytest)
```

## Deploy (Vercel)
Importe o repositório na Vercel e cadastre as variáveis do `.env.example` em *Settings → Environment Variables*. O `vercel.json` encaminha `/api/*` para o FastAPI.

## Estrutura
```
api/index.py        backend: RAG + LLM + validação + fallback + salas PvP
src/App.jsx         telas: menu, filtros, trilha, resultado, ranking
src/Quiz.jsx        tela de gameplay (HUD, timer, prefetch)
src/Pvp.jsx         lobby/placar PvP com Supabase Realtime
src/QuemE.jsx       modo "Quem é esse jogador?"
src/Album.jsx       álbum de figurinhas e abertura de pacotinho
api/jogadores.json  24 craques: pistas curadas, foto (Wikimedia Commons) e traços p/ caricatura
src/logic.js        regras do jogo (puras, testadas)
supabase/           schema (RLS + Realtime) e base de fatos curada
scripts/            pós-processamento dos assets do Gemini e geração de api/jogadores.json
tests/              testes automatizados
docs/               relatório CP5, prompts das caricaturas e mockups da CP4

## Créditos de imagem
Fotos dos jogadores: Wikimedia Commons, licenças livres (CC/domínio público). Cada foto tem link para a página do arquivo, com autor e licença, exibido no jogo depois que o jogador é revelado. Mascote, estádio e caricaturas: gerados com Google Gemini.
```
