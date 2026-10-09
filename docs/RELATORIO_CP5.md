# CP5 — Camisa 10: A Trilha do Craque (MVP)

> ⚠️ **RASCUNHO.** Partes marcadas com ✍️ precisam ser escritas/conferidas pelo grupo. O professor exige que a seção 3.2 seja texto próprio, não gerado por IA.

## 1. Entrega
- Jogo online: `https://SEU-PROJETO.vercel.app`
- Repositório: `https://github.com/...`
- Vídeo (2–5 min): `LINK`

## 2. Continuidade com a CP4

| CP4 | MVP CP5 | Status |
|---|---|---|
| Título, gênero (quiz/trivia + RPG leve), premissa | Iguais | ✅ |
| Tela 1 — Menu principal (título, mascote, 4 botões, fundo) | Implementada (`Menu` em `src/App.jsx`) | ✅ |
| Tela 2 — Gameplay (barra de progresso, sequência, timer, pergunta IA, 4 alternativas, mascote) | Implementada (`src/Quiz.jsx`) | ✅ |
| Tela 3 — Seleção de modo e filtros | Implementada (`Filtros` em `src/App.jsx`) | ✅ |
| Mecânica: trilha de progressão | 4 blocos × 3 níveis com desbloqueio | ✅ |
| Mecânica: filtros (categoria, dificuldade) | Sim | ✅ |
| Mecânica: PvP (mesmo lote, acertos + tempo) | Online, por código de sala | ✅ |
| Mecânica: sobrevivência (dificuldade sobe, fim no erro/tempo) | Sim | ✅ |
| IA texto: Llama + RAG + JSON mode + nova tentativa | Sim (provedor mudou, ver seção 4) | ✅ |
| IA imagem: mascote e fundo Gemini, fundo removido por thresholding | Sim, integrados ao jogo | ✅ |
| Prefetch da próxima pergunta / lote na campanha | Sim | ✅ |
| Extras: ranking global, pontuação por rapidez, sons, animações, fallback de IA | Novos (acréscimos, não mudanças) | ➕ |

## 3. Diário de Vibe Coding

**Ferramenta:** Claude Code (app desktop), modelo Claude Opus 5.5.

> ✍️ Registrar aqui os prompts reais. Os dois primeiros abaixo são desta sessão; complete até ter pelo menos 5 conforme forem feitos (deploy, ajustes depois de jogar, correção de bugs).

### Prompt 1 — Planejamento e arquitetura
- **Pedido:** "tenho esse trabalho da faculdade que preciso tirar 10 [...] criar o melhor aplicativo [...] como se fosse um mvp com um banco de dados no supabase, um frontend no vercel [...] colocar tudo no github", anexando o PDF da CP5 e o relatório da CP4.
- **O que a IA gerou:** leitura dos dois documentos e dos mockups; identificou o conflito (Ollama local não roda num site publicado na Vercel); propôs manter React + FastAPI + Pydantic e trocar só o provedor do LLM (Groq, mesma família Llama) e o SQLite pelo Supabase; mapeou cada item da rubrica (inclusive os critérios do 10).
- **O que o grupo decidiu ou ajustou:** escolheu o PvP **online** com código de sala, em vez do local, e a **Groq** em vez da Gemini API, para manter o Llama e reduzir a mudança em relação à CP4.

### Prompt 2 — Implementação do MVP
- **Pedido:** respostas às perguntas de arquitetura (PvP online, Groq, contas existentes) → implementação.
- **O que a IA gerou:** schema do Supabase com RLS e Realtime, base de 48 fatos, backend FastAPI, frontend com as 3 telas do mockup, trilha, PvP, testes.
- **Ajustes e correções feitos no processo (reais):**
  1. **Remoção de fundo do mascote:** a 1ª versão usava threshold global de cor, o que também apagaria o branco dos olhos e da bola. Trocado por *flood fill* a partir das bordas (`scripts/prepara_assets.py`).
  2. **Bug do header de autenticação:** testando com o Ollama local (sem chave), a requisição falhava com `LocalProtocolError: Illegal header value b'Bearer '`. Corrigido com um valor padrão quando não há chave.
  3. **Timeout:** no Ollama em CPU, a primeira chamada levou **106,7 s** e as seguintes **7–11 s**, estourando o timeout de 20 s. O timeout virou configurável (`LLM_TIMEOUT`). Esse dado reforçou a decisão de usar a Groq no deploy.
  4. **Resposta correta sempre em 1º:** o modelo coloca a resposta certa como alternativa A (já aparecia no exemplo da CP4: "Brasil" primeiro). O backend passou a embaralhar as alternativas.
  5. **V/F sem alternativas:** o teste 2 da CP4 mostrou que o modelo omite `alternativas` no verdadeiro/falso; o backend força `["Verdadeiro","Falso"]` antes de validar.
  6. **Fatos datados:** como a Copa de 2026 já aconteceu, fatos como "Brasil tem 5 títulos" foram reescritos como "até a Copa de 2022", para a IA não gerar perguntas desatualizadas.
  7. **React StrictMode removido:** ele roda os efeitos 2× em desenvolvimento e dobraria as chamadas ao LLM.

### Prompt 3 — ✍️ (ex.: configuração do Supabase/Vercel e primeiro deploy)
- Pedido / O que a IA gerou / O que ajustamos:

### Prompt 4 — ✍️ (ex.: bug encontrado jogando o PvP com dois navegadores)
### Prompt 5 — ✍️ (ex.: ajuste de dificuldade/visual depois de jogar)

### 3.2 Como o código funciona — ✍️ TEXTO DO GRUPO (não gerado por IA)
> Escrevam com as próprias palavras. Roteiro sugerido: (1) o que acontece quando o jogador clica em "Iniciar partida" até a pergunta aparecer (`Partida` → `api('perguntas')` → `montar_lote` → `gerar` → `chamar_llm` → `normalizar`); (2) como o fallback decide usar o cache; (3) como o `Quiz.jsx` faz o prefetch e o timer; (4) como o PvP usa Presence, Broadcast e Postgres Changes; (5) por que a validação Pydantic existe.

## 4. Diário de Mudanças em relação à CP4

| Item alterado | CP4 | CP5 | Justificativa técnica |
|---|---|---|---|
| Provedor do LLM em produção | Llama 3.2 3B local via Ollama | Llama 3.1 8B via **Groq** (API compatível com OpenAI); Ollama continua suportado trocando `LLM_BASE_URL` | O MVP precisa ser jogável publicamente (critério do 10) e uma função na Vercel não alcança um Ollama rodando no notebook do grupo. Antes de mudar, testamos localmente: em CPU sem GPU a 1ª geração levou 106,7 s e as seguintes 7–11 s, inviável para o timer de 20 s da sobrevivência. A Groq hospeda modelos Llama (mesma família e licença) com latência abaixo de 1 s e camada gratuita. **Impacto:** o código é o mesmo para os dois provedores (só muda a URL/variável), então o modo local da CP4 continua funcionando. |
| Versão/tamanho do modelo | Llama 3.2 **3B** | Llama 3.1 **8B** (`llama-3.1-8b-instant`) | ✍️ Conferir no console da Groq se o 3B está disponível. O 8B é o menor Llama oferecido de forma estável na Groq; segue melhor o JSON e o português. Configurável por `LLM_MODEL`. |
| Banco da base de fatos | SQLite local | **Supabase (PostgreSQL)** | Um arquivo SQLite não persiste em funções serverless (sistema de arquivos efêmero) e não permite PvP entre dois dispositivos. O Supabase dá Postgres gerenciado e Realtime (lobby e placar PvP) no mesmo serviço. **Impacto:** a recuperação RAG continua sendo filtro direto por categoria/dificuldade, como previsto na CP4. |
| Hospedagem do backend | Uvicorn local | FastAPI como função Python na **Vercel** (Uvicorn só em dev) | Mesmo motivo da publicação. O FastAPI e o Pydantic foram mantidos. |
| PvP | "dois jogadores competem" (sem definir se local ou online) | Online, com código de sala (Supabase Realtime) | Detalhamento, não remoção: a CP4 citava o Kahoot como referência direta, e o Kahoot é multi-dispositivo. |
| Formatos de pergunta | múltipla escolha e V/F | Iguais; V/F é mais frequente no nível 1 | Ajuste de balanceamento. |

## 5. Checklist de testes manuais — ✍️ preencher jogando

| # | Mecânica / tela | Resultado esperado | Resultado obtido |
|---|---|---|---|
| 1 | Menu → "JOGAR (Campanha)" | Abre a trilha com só a fase 1 liberada | |
| 2 | Fase 1 com 3+ acertos | Fase marcada com ★ e fase 2 liberada | |
| 3 | Fase com menos de 3 acertos | "Quase lá!" e fase seguinte continua trancada | |
| 4 | Selo da pergunta | 🤖 "Gerada agora pela IA" | |
| 5 | LLM fora (chave inválida no `.env`) | Pergunta vem com selo 📦 cache, sem travar | |
| 6 | Sobrevivência: deixar o tempo zerar | "Tempo esgotado!" e fim de jogo | |
| 7 | Sobrevivência: 3 acertos seguidos | Dificuldade sobe (perguntas mais difíceis) | |
| 8 | Salvar no ranking | Nome aparece no Ranking global | |
| 9 | PvP: criar sala em um navegador e entrar com o código em outro | Os dois aparecem no lobby | |
| 10 | PvP: anfitrião clica "Começar" | Os dois recebem as mesmas perguntas | |
| 11 | PvP: os dois terminam | Placar ao vivo com o vencedor 🏆 | |
| 12 | Filtros: Estatísticas + Difícil + Sobrevivência | Perguntas só dessa categoria | |
| 13 | Celular (tela estreita) | Layout em 1 coluna, jogável | |

**Testes automatizados:** `npm test`, com 15 testes (trilha, aprovação, dificuldade progressiva, pontuação, streak, placar PvP, validação da saída do LLM, fallback para o cache, 503 e 422).

## 6. Roteiro sugerido para o vídeo (≈4 min)
1. Menu, mostrando que mascote e fundo vieram do Gemini (CP4).
2. Filtros → Campanha → trilha → jogar a fase 1, destacando o selo 🤖 e a explicação.
3. Sobrevivência: timer, sequência, erro → resultado → ranking.
4. PvP com duas janelas lado a lado: criar sala, entrar, jogar, placar ao vivo.
5. Fallback: trocar a chave por uma inválida, mostrar o selo 📦 e o jogo seguindo normalmente.
6. `npm test` rodando no terminal.
