import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FASES, faseLiberada, faseAprovada, dificuldadeSobrevivencia, pontos, ordenarPlacar, sequenciaApos, TEMPO_LIMITE_MS } from '../src/logic.js'

test('trilha: 12 fases, só a primeira liberada no início', () => {
  assert.equal(FASES.length, 12)
  assert.equal(faseLiberada(0, []), true)
  assert.equal(faseLiberada(1, []), false)
  assert.equal(faseLiberada(1, [FASES[0].id]), true)
})

test('trilha: precisa de 3 acertos em 5 para passar', () => {
  assert.equal(faseAprovada(2), false)
  assert.equal(faseAprovada(3), true)
})

test('sobrevivência: dificuldade sobe a cada 3 acertos e trava em 3', () => {
  assert.equal(dificuldadeSobrevivencia(1, 0), 1)
  assert.equal(dificuldadeSobrevivencia(1, 2), 1)
  assert.equal(dificuldadeSobrevivencia(1, 3), 2)
  assert.equal(dificuldadeSobrevivencia(1, 6), 3)
  assert.equal(dificuldadeSobrevivencia(2, 30), 3)
})

test('pontuação: erro vale 0, resposta instantânea vale 1000, no limite vale 500', () => {
  assert.equal(pontos(false, 100), 0)
  assert.equal(pontos(true, 0), 1000)
  assert.equal(pontos(true, TEMPO_LIMITE_MS), 500)
  assert.ok(pontos(true, 2000) > pontos(true, 8000))
})

test('sequência (streak) zera no erro', () => {
  assert.equal(sequenciaApos(4, true), 5)
  assert.equal(sequenciaApos(4, false), 0)
})

test('placar PvP: mais pontos vence; empate decide pelo menor tempo', () => {
  const r = ordenarPlacar([
    { nome: 'A', pontos: 3000, tempo_ms: 9000 },
    { nome: 'B', pontos: 4000, tempo_ms: 20000 },
    { nome: 'C', pontos: 3000, tempo_ms: 5000 },
  ])
  assert.deepEqual(r.map((x) => x.nome), ['B', 'C', 'A'])
})
