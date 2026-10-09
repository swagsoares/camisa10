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
