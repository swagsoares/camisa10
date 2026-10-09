# CP5 — Camisa 10: A Trilha do Craque (MVP)

> ⚠️ **RASCUNHO.** Partes marcadas com ✍️ precisam ser escritas/conferidas pelo grupo. O professor exige que a seção 3.2 seja texto próprio, não gerado por IA.

## 1. Entrega
- Jogo online: https://camisa10-three.vercel.app
- Repositório: https://github.com/swagsoares/camisa10
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
| IA texto: LLM local/aberto + RAG + JSON mode + nova tentativa | Sim (provedor e modelo mudaram, ver seção 4) | ✅ |
| IA imagem: mascote e fundo Gemini, fundo removido por thresholding | Sim, integrados ao jogo | ✅ |
| Prefetch da próxima pergunta / lote na campanha | Sim | ✅ |
| Extras: ranking global, pontuação por rapidez, sons, animações, fallback de IA | Novos (acréscimos, não mudanças) | ➕ |
| Extra: modo "Quem é esse jogador?" (caricatura IA + foto que clareia + dicas IA) | Novo (acréscimo) | ➕ |
| Extra: álbum de figurinhas com pacotinhos em todos os modos | Novo (acréscimo) | ➕ |

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

### Prompt 3 — Configurar a chave da Groq
- **Pedido:** "pode colocar para mim por favor [chave da Groq]".
- **O que a IA gerou:** criou o `.env` (ignorado pelo git) e testou a chave listando os modelos. Descobriu que a Groq **não oferece mais o Llama de chat**. Fez um teste comparativo entre `openai/gpt-oss-20b` e `qwen/qwen3.8-27b` com 4 fatos reais da base.
- **O que o grupo decidiu ou ajustou:** adotou o Qwen 3.8 27B como padrão (resultado do teste na seção 4); o selo do jogo deixou de citar "Llama" e o Diário de Mudanças ganhou uma linha nova.

### Prompt 4 — Conectar o Supabase e testar o jogo inteiro
- **Pedido:** "eu rodei os 2 já no supabase" e, em seguida, o envio das chaves do projeto.
- **O que a IA gerou:** preencheu o `.env`, conferiu as tabelas e o RLS pela API (a chave pública não enxerga `facts` nem `questions`), subiu backend e frontend e jogou no navegador: uma fase da campanha, a sobrevivência até o tempo esgotar com gravação no ranking, e o PvP com duas abas (Ana × Beto), com lobby, início sincronizado e placar ao vivo. Também simulou a IA fora do ar.
- **Problemas encontrados e corrigidos:**
  1. **Base de fatos pequena:** cada categoria/nível tinha só 4 fatos, mas uma fase pede 5 perguntas, e o lote voltava com 4. Ampliamos para 6 fatos por célula (72 no total).
  2. **Alternativas incoerentes:** a IA gerou "Como devem ser posicionadas as mãos no arremesso lateral?" com a alternativa "Com os pés", e a resposta certa continuava sendo a mais longa. Acrescentamos ao prompt que as 4 alternativas devem ser do mesmo tipo, responder à pergunta e ter tamanho parecido. No reteste vieram 4 anos, 4 intervalos em metros, 4 seleções etc.
  3. **Mascote cobrindo a alternativa A** em telas estreitas: escondido abaixo de 900px.
  4. **Chaves novas do Supabase (`sb_secret_`)** não são JWT e não podem ir no header `Authorization`; o backend passou a mandar só `apikey` nesse caso.

### Prompt 5 — GitHub + novos modos ("Quem é esse jogador?" e figurinhas)
- **Pedido:** "pode criar sim o repositório [...] ver repositórios do github para ajudar [...] usar alguma ia de vídeo como 'quem é esse jogador' aí vem uma foto do ronaldinho com traços de famosos e aí com chutes vai ficando mais fácil [...] também um modo figurinha".
- **O que a IA gerou:** criou o repositório público (antes, verificou que nenhuma chave estava no histórico do git); pesquisou no GitHub (pouca coisa útil, só a ideia de usar a carreira em clubes como dica); implementou os dois modos.
- **O que foi rejeitado ou ajustado (decisão do grupo com a IA):**
  1. **IA de vídeo e rosto do Ronaldinho misturado com o de outros famosos foram rejeitados.** Geradores de imagem bloqueiam pessoas reais, misturar rostos é na prática um deepfake publicado num site aberto, e vídeo seria uma modalidade nova fora da CP4. Escolhemos **as duas** alternativas propostas: caricatura cartoon só com traços icônicos (Gemini, mesma técnica da CP4) como primeira dica, e foto real com licença livre (Wikimedia Commons) que começa borrada e clareia a cada erro.
  2. **Figurinhas:** o grupo pediu que *todos os modos* dessem recompensa, com mais figurinhas nos níveis mais altos da campanha.
- **Problemas reais encontrados e corrigidos:**
  1. **Alucinação nas dicas:** a IA escreveu que o Maradona foi "tricampeão mundial" (a Argentina tinha 2 títulos em 1986) e que os títulos do Napoli foram "consecutivos" (foram 1987 e 1990). Criamos a validação `dicas_validas`: a dica não pode conter números que não estão na pista nem o nome do jogador. O prompt também proíbe acrescentar qualificações como "bi", "tri" e "consecutivo", e a temperatura baixou de 0,8 para 0,5. Se falhar, o jogo usa as pistas escritas pelo grupo.
  2. **Cota da Groq (HTTP 429):** a camada gratuita do Qwen limita a 1.000 tokens de saída por minuto, e a Groq reserva o `max_tokens` padrão a cada chamada. Passamos a definir `max_tokens` e criamos uma **lista de modelos com reserva**: estourou a cota do Qwen, tenta o gpt-oss-20b; se todos falharem, usa o cache.
  3. **Tela branca em dev:** o proxy do Vite mandava `/api/jogadores.json` (importado pelo front) para o FastAPI. O proxy passou a ignorar `.json`.
  4. **Bandeiras viravam letras ("NO", "BR")** no Chrome do Windows, que não tem emoji de bandeira. Resolvido com a fonte Noto Color Emoji.
  5. **API da Wikipedia retornava 403** sem um User-Agent identificado (política de robôs da Wikimedia); usamos um com o link do repositório.
### Prompt 6 — Revisão geral antes do deploy + pesquisa de apps parecidos
- **Pedido:** "antes de começarmos a colocar no ar vamos ver tudo que fizemos e tudo que podemos melhorar" e "podemos ver apps parecidos e ver o que conseguimos melhorar"; depois, "melhorar essa parte de filtros e configurações".
- **O que a IA gerou:** uma auditoria item por item da rubrica, com teste no celular (375px), e uma pesquisa de referências (Who Are Ya?, FootyIQ, On Yer Head, Duolingo, Kahoot).
- **Riscos encontrados e corrigidos:**
  1. **O Supabase gratuito pausa após 7 dias sem acesso.** Se o professor abrisse o link semanas depois, o jogo quebraria. Solução: cron diário da Vercel em `/api/saude`, que consulta o banco.
  2. **Cota da IA na apresentação** (turma jogando ao mesmo tempo): pré-geramos com a IA 105 perguntas (2+ por fato) e 2 versões de dicas por jogador. Nenhuma falhou na validação.
  3. **Tela de filtros confusa:** o modo ficava abaixo do botão "Iniciar", o modo escolhido não se destacava, os filtros apareciam na Campanha (onde não valem) e não existia nenhuma configuração, apesar do nome do botão. A tela foi reorganizada (modo → filtros → iniciar) e ganhou configurações (nome, som, apagar progresso).
- **O que o grupo decidiu ou rejeitou:** das 4 ideias tiradas dos apps parecidos (pistas por comparação, desafio diário, ajuda 50/50, compartilhar resultado), implementamos **só as pistas por comparação**, que melhoram um modo existente sem criar tela nova. As outras ficaram como trabalhos futuros, para não inflar o escopo, o vídeo de 5 minutos e o código que precisamos saber explicar.
- **Também entrou:** CI no GitHub Actions (os testes rodam a cada push) e ranking do "Quem é esse jogador?".

### Prompt 7 — Deploy na Vercel
- **Pedido:** "só falta o deploy no vercel, consegue me ajudar".
- **O que a IA gerou:** o passo a passo do deploy; o grupo fez o login e cadastrou as variáveis no painel. Depois, a IA testou o site publicado: `/api/saude` (banco ok), perguntas e dicas geradas pela IA, ranking, caricaturas e criação de sala PvP com lobby em tempo real.
- **Ajustes durante o deploy:** a Vercel sugeriu adicionar a integração do Supabase, o que **recusamos**, porque ela criaria um banco novo com outras variáveis. A Vercel também alertou que variáveis `VITE_` ficam expostas no navegador, o que é **intencional** para a URL e a chave *anon* (pública, protegida pelo RLS); a chave *service* ficou sem o prefixo. Na primeira tentativa de salvar, as variáveis duplicaram e precisamos limpar o formulário.
- **Alucinação encontrada só em produção:** a dica do Zico dizia "Conquistou títulos na Udinese e no Kashima", mas a pista era apenas "Jogou na Udinese...". A validação por números não pegava esse caso. Criamos uma regra por **grupos de sinônimos**: palavras de conquista (título, campeão, venceu, recorde, artilheiro) só podem aparecer se a pista já fala daquele tipo de feito ("ganhou" libera "conquistou"; "maior artilheiro" libera "recorde"). Revalidamos o cache: 4 de 48 versões foram reprovadas (entre elas "recordes de gol" para o Romário e "ex-campeão do Palmeiras" para o Roberto Carlos, nenhuma presente nas pistas) e foram regeneradas. Teste de regressão: `test_dica_que_inventa_conquista_e_barrada`.

## 3.3 Trabalhos futuros
- Desafio diário ("jogador do dia", igual para todos) com sequência de dias, estilo Wordle e FootyIQ.
- Ajuda 50/50 no quiz (power-up estilo Kahoot e Duolingo) e compartilhar o resultado com emojis.
- Validar as respostas no servidor (hoje ficam no navegador, então dá para trapacear pelo DevTools no PvP e no "Quem é") e conferir pontuações antes de gravar no ranking.
- Login (Supabase Auth) para sincronizar álbum e progresso entre aparelhos. — ✍️ (ex.: ajuste de dificuldade/visual depois de jogar)

### 3.2 Como o código funciona (texto do grupo)

**Do clique até a pergunta.** Quando o jogador clica em "Iniciar", o front-end em React pede as perguntas ao backend. A gente busca os fatos no Supabase e envia para a IA gerar a pergunta e as quatro alternativas. O Pydantic valida tudo e embaralhamos as alternativas, porque a resposta certa sempre aparecia primeiro.

**Quando a IA dá problema.** Se a Groq estourar a cota, tentamos outro modelo, o gpt-oss. Se falhar, usamos perguntas guardadas em cache. No "Quem é", barramos dicas inventadas. Aconteceu com o Zico: a IA disse que ele foi campeão na Udinese, mas ele só jogou lá.

**O PvP.** Quem cria a sala recebe um código de quatro letras, e as cinco perguntas ficam salvas no Supabase. O Realtime sincroniza os jogadores e o placar. Ganha quem fizer mais pontos, e responder mais rápido vale mais.

## 4. Diário de Mudanças em relação à CP4

| Item alterado | CP4 | CP5 | Justificativa técnica |
|---|---|---|---|
| Provedor do LLM em produção | Llama 3.2 3B local via Ollama | **Groq** (API compatível com OpenAI); Ollama continua suportado trocando `LLM_BASE_URL` | O MVP precisa ser jogável publicamente (critério do 10) e uma função na Vercel não alcança um Ollama rodando no notebook do grupo. Antes de mudar, testamos localmente: em CPU sem GPU a 1ª geração levou 106,7 s e as seguintes 7–11 s, inviável para o timer de 20 s da sobrevivência. A Groq roda modelos de pesos abertos com latência em torno de 1 s e tem camada gratuita. **Impacto:** o código é o mesmo para os dois provedores (só muda a URL/variável), então o modo local da CP4 continua funcionando. |
| Modelo de texto | Llama 3.2 **3B** (Meta) | **Qwen 3.8 27B** (Alibaba, pesos abertos) — `qwen/qwen3.8-27b` | O plano era usar o Llama na Groq, mas ao listar os modelos da conta (`GET /models`) em out/2026 a Groq não oferecia mais nenhum Llama de chat (só `llama-prompt-guard`, que é um classificador de segurança). Testamos os dois modelos abertos disponíveis no nosso próprio pipeline (4 fatos, múltipla escolha e V/F): **gpt-oss-20b** 4/4 JSON válido em ~1,1 s, mas a resposta correta costumava ser a alternativa mais longa e detalhada, o que entrega a resposta; **Qwen 3.8 27B** 4/4 válidos em 0,7–1,2 s, com alternativas de tamanho parecido e distratores plausíveis. Escolhemos o Qwen. **Impacto:** nenhum no código (só a variável `LLM_MODEL`); a arquitetura RAG continua a mesma, e o modo local segue funcionando com `llama3.2:3b` ou `qwen2.5:7b` no Ollama. |
| Banco da base de fatos | SQLite local | **Supabase (PostgreSQL)** | Um arquivo SQLite não persiste em funções serverless (sistema de arquivos efêmero) e não permite PvP entre dois dispositivos. O Supabase dá Postgres gerenciado e Realtime (lobby e placar PvP) no mesmo serviço. **Impacto:** a recuperação RAG continua sendo filtro direto por categoria/dificuldade, como previsto na CP4. |
| Hospedagem do backend | Uvicorn local | FastAPI como função Python na **Vercel** (Uvicorn só em dev) | Mesmo motivo da publicação. O FastAPI e o Pydantic foram mantidos. |
| PvP | "dois jogadores competem" (sem definir se local ou online) | Online, com código de sala (Supabase Realtime) | Detalhamento, não remoção: a CP4 citava o Kahoot como referência direta, e o Kahoot é multi-dispositivo. |
| Formatos de pergunta | múltipla escolha e V/F | Iguais; V/F é mais frequente no nível 1 | Ajuste de balanceamento. |
| Modelo único → lista com reserva | 1 modelo | `LLM_MODEL=qwen/qwen3.8-27b,openai/gpt-oss-20b` | Nos testes, a camada gratuita da Groq retornou 429 (cota de 1.000 tokens de saída/min do Qwen). Antes de mudar, limitamos `max_tokens`, o que reduziu a reserva mas não eliminou o risco com vários jogadores ao mesmo tempo. A reserva usa um modelo aberto com cota separada. **Impacto:** nenhum no formato das perguntas (mesma validação Pydantic). |
| Novos modos: "Quem é esse jogador?" e álbum de figurinhas | Não existiam | Implementados | **Acréscimo**, não substituição: as 4 mecânicas da CP4 seguem intactas. Usam as mesmas modalidades de IA já planejadas: texto (LLM narra dicas a partir de pistas curadas, com a mesma lógica RAG) e imagem (caricaturas no Gemini, como o mascote). Uma ideia inicial de usar IA de vídeo e misturar rostos de famosos foi descartada por questões éticas e de direito de imagem; as fotos reais vêm da Wikimedia Commons, com licença livre e crédito. |
| Tela 1 — Menu principal | 4 botões (Campanha, PvP, Sobrevivência, Filtros e Configurações) + título + mascote + fundo | Os mesmos 4 botões, na mesma ordem e com as mesmas cores, + botão "Quem é esse jogador?" + atalhos para Álbum e Ranking | Os botões novos dão acesso aos modos acrescentados; todos os elementos numerados do mockup (título, mascote, fundo, 4 botões) continuam presentes. No celular, o mascote vai para cima dos botões para caber na tela. |
| Tela 3 — Seleção de modo e filtros | Filtros (categoria, dificuldade) à esquerda e modo à direita; botão "Iniciar partida" dentro dos filtros | Mesmos elementos, reordenados: 1. modo (com descrição) → 2. filtros → botão "Iniciar <modo>"; + seção Configurações (nome, som, apagar progresso) | No celular, o botão "Iniciar" aparecia **antes** da escolha de modo (a coluna da direita caía para baixo) e não ficava claro qual modo estava escolhido. Os filtros também apareciam na Campanha, onde não valem (a trilha define tema e nível). E o mockup chamava a tela de "Filtros e **Configurações**", mas não existia nenhuma configuração; a seção nova cumpre esse nome. |
| "Quem é esse jogador?" — revelação da caricatura | (modo novo) | Caricatura começa em **silhueta**, fica colorida e borrada no 2º erro e nítida no 3º (estilo "Quem é esse Pokémon?") | Nos testes, a caricatura nítida entregava a resposta logo de cara e o modo ficava fácil demais. Agora ela revela aos poucos, como a foto. |

## 5. Checklist de testes manuais — ✍️ preencher jogando

| # | Mecânica / tela | Resultado esperado | Resultado obtido |
|---|---|---|---|
| 1 | Menu → "JOGAR (Campanha)" | Abre a trilha com só a fase 1 liberada | ✅ OK |
| 2 | Fase 1 com 3+ acertos | Fase marcada com ★ e fase 2 liberada | |
| 3 | Fase com menos de 3 acertos | "Quase lá!" e fase seguinte continua trancada | ✅ OK (1/5 → "Quase lá!") |
| 4 | Selo da pergunta | 🤖 "Gerada agora pela IA" | ✅ OK |
| 5 | LLM fora (chave inválida no `.env`) | Pergunta vem com selo 📦 cache, sem travar | ✅ OK (5/5 do cache em 3,9 s) |
| 6 | Sobrevivência: deixar o tempo zerar | "Tempo esgotado!" e fim de jogo | ✅ OK |
| 7 | Sobrevivência: 3 acertos seguidos | Dificuldade sobe (perguntas mais difíceis) | |
| 8 | Salvar no ranking | Nome aparece no Ranking global | ✅ OK |
| 9 | PvP: criar sala em um navegador e entrar com o código em outro | Os dois aparecem no lobby | ✅ OK |
| 10 | PvP: anfitrião clica "Começar" | Os dois recebem as mesmas perguntas | ✅ OK |
| 11 | PvP: os dois terminam | Placar ao vivo com o vencedor 🏆 | ✅ OK (atualizou sem recarregar) |
| 12 | Filtros: Estatísticas + Difícil + Sobrevivência | Perguntas só dessa categoria | |
| 13 | Celular (tela estreita) | Layout em 1 coluna, jogável | ✅ OK (375px: menu e gameplay sem rolagem lateral) |
| 14 | Quem é: chute errado | Foto clareia, nova dica abre, valor cai 200 pts | ✅ OK (blur 28px → 13px após 2 erros) |
| 15 | Quem é: chute certo ("haaland" minúsculo e sem acento) | "Golaço!", pacotinho com a figurinha NOVA | ✅ OK |
| 16 | Quem é: IA fora do ar | Dicas com selo "dicas do grupo" | ✅ (teste automatizado) |
| 17 | Álbum | Mostra coladas, vagas numeradas, brilhantes douradas, "x2" nas repetidas | ✅ OK |
| 18 | Passar fase nível 3 da campanha | Pacotinho com 3 figurinhas, 1 brilhante | |
| 19 | Vencer PvP | Pacotinho com 3 figurinhas para o vencedor e 1 para o outro | |
| 20 | Quem é: chutar outro jogador do álbum | Pistas de país e setor (verde = igual) | ✅ OK ("Messi" num desafio do Cristiano → "Ataque = mesmo setor") |
| 21 | Filtros: escolher Sobrevivência | Filtros aparecem e o botão vira "INICIAR SOBREVIVÊNCIA" | ✅ OK |
| 22 | Configurações: desligar o som | Sem efeitos sonoros até religar | ✅ OK |
| 23 | Quem é: início da rodada | Caricatura em silhueta preta e foto bem borrada | ✅ OK |
| 24 | Jogo publicado (https://camisa10-three.vercel.app) | Abre sem instalar nada; IA, ranking, Quem é e PvP funcionam | ✅ OK |

**Testes automatizados:** `npm test`, com 25 testes, também rodando no GitHub Actions a cada push (trilha, aprovação, dificuldade progressiva, pontuação, streak, placar PvP, chute do "Quem é", recompensas e pacotinhos, validação da saída do LLM, anti-alucinação das dicas, fallback para cache e pistas curadas, 404/422/503).

## 6. Roteiro sugerido para o vídeo (≈4 min)
1. Menu, mostrando que mascote e fundo vieram do Gemini (CP4).
2. Filtros → Campanha → trilha → jogar a fase 1, destacando o selo 🤖 e a explicação.
3. Sobrevivência: timer, sequência, erro → resultado → ranking.
4. PvP com duas janelas lado a lado: criar sala, entrar, jogar, placar ao vivo.
5. "Quem é esse jogador?": errar 2 chutes (foto clareia, dicas abrem) e acertar; abrir o pacotinho e mostrar o álbum.
6. Fallback: trocar a chave por uma inválida, mostrar o selo 📦 e o jogo seguindo normalmente.
7. `npm test` rodando no terminal.
