// Regras do jogo, sem React — testadas em tests/logic.test.js (node --test).

export const BLOCOS = [
  { id: 'regras', nome: 'Regras do Jogo', icone: '📏' },
  { id: 'historia', nome: 'História das Copas', icone: '🏆' },
  { id: 'craques', nome: 'Craques Lendários', icone: '⭐' },
  { id: 'estatisticas', nome: 'Números e Recordes', icone: '📊' },
]
export const NIVEIS = ['Fácil', 'Médio', 'Difícil']
export const PERGUNTAS_POR_FASE = 5
export const ACERTOS_PARA_PASSAR = 3
export const TEMPO_LIMITE_MS = 20000

// Trilha (estilo Duolingo): 4 blocos x 3 níveis = 12 fases em sequência.
export const FASES = BLOCOS.flatMap((b, i) =>
  NIVEIS.map((_, n) => ({ id: `${b.id}-${n + 1}`, bloco: b, numeroBloco: i + 1, categoria: b.id, dificuldade: n + 1 })),
)

export const faseLiberada = (indice, concluidas) => indice === 0 || concluidas.includes(FASES[indice - 1].id)

export const faseAprovada = (acertos) => acertos >= ACERTOS_PARA_PASSAR

// Sobrevivência: começa no nível escolhido e sobe 1 nível a cada 3 acertos (máx. 3).
export const dificuldadeSobrevivencia = (inicial, acertos) => Math.min(3, inicial + Math.floor(acertos / 3))

// Pontuação estilo Kahoot: 500 por acerto + até 500 de bônus por rapidez.
export function pontos(acertou, tempoMs, limiteMs = TEMPO_LIMITE_MS) {
  if (!acertou) return 0
  const resto = Math.max(0, 1 - tempoMs / limiteMs)
  return 500 + Math.round(500 * resto)
}

// Placar PvP: mais pontos vence; empate desempata por menor tempo total.
export const ordenarPlacar = (resultados) =>
  [...resultados].sort((a, b) => b.pontos - a.pontos || a.tempo_ms - b.tempo_ms)

export const sequenciaApos = (sequencia, acertou) => (acertou ? sequencia + 1 : 0)

// ---------- "Quem é esse jogador?" ----------
export const CHUTES_MAX = 5
// A foto começa irreconhecível e clareia a cada chute errado; na 5ª tentativa fica nítida.
export const BLUR_POR_ERRO = [28, 20, 13, 7, 2]
export const blurFoto = (erros) => BLUR_POR_ERRO[Math.min(erros, BLUR_POR_ERRO.length - 1)]
export const pontosQuemE = (erros) => (erros >= CHUTES_MAX ? 0 : 1000 - erros * 200)

const limpo = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
// Aceita o nome completo, qualquer apelido cadastrado ou o sobrenome (ex.: "Messi", "zidane", "R10").
export function acertouJogador(chute, jogador) {
  const c = limpo(chute)
  if (c.length < 3) return false
  const nomes = [jogador.nome, ...jogador.apelidos, jogador.nome.split(' ').at(-1)].map(limpo)
  return nomes.includes(c)
}

// ---------- Álbum de figurinhas ----------
// colecao = { [idJogador]: { qtd, brilhante } }. Recompensas de todos os modos:
export function recompensa(modo, d) {
  if (modo === 'campanha') {
    if (!faseAprovada(d.acertos)) return { n: 0, brilhantes: 0 }
    // Quanto mais alto o nível, mais figurinhas; fechar um bloco (nível 3) dá uma brilhante extra.
    return { n: d.dificuldade, brilhantes: d.dificuldade === 3 ? 1 : 0 }
  }
  if (modo === 'sobrevivencia') return { n: Math.min(5, Math.floor(d.acertos / 3)), brilhantes: d.acertos >= 15 ? 1 : 0 }
  if (modo === 'pvp') return { n: d.venceu ? 3 : 1, brilhantes: d.venceu ? 1 : 0 }
  return { n: 0, brilhantes: 0 }
}

// Sorteia um pacotinho (com repetidas, como na vida real). rng injetável para teste.
export function abrirPacote(ids, { n, brilhantes }, rng = Math.random) {
  return Array.from({ length: n }, (_, i) => ({ id: ids[Math.floor(rng() * ids.length)], brilhante: i < brilhantes }))
}

export function colar(colecao, figurinhas) {
  const nova = { ...colecao }
  const resultado = figurinhas.map((f) => {
    const antes = nova[f.id]
    nova[f.id] = { qtd: (antes?.qtd ?? 0) + 1, brilhante: Boolean(antes?.brilhante || f.brilhante) }
    return { ...f, nova: !antes }
  })
  return { colecao: nova, resultado }
}
