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

import { acertouJogador, blurFoto, pontosQuemE, recompensa, abrirPacote, colar } from '../src/logic.js'

const RONALDINHO = { nome: 'Ronaldinho', apelidos: ['ronaldinho gaucho', 'r10'] }
const MESSI = { nome: 'Lionel Messi', apelidos: ['messi', 'la pulga'] }

test('quem é: aceita nome, apelido e sobrenome, ignorando acento e maiúscula', () => {
  assert.ok(acertouJogador('Ronaldinho Gaúcho', RONALDINHO))
  assert.ok(acertouJogador('r10', RONALDINHO))
  assert.ok(acertouJogador('MESSI', MESSI))
  assert.ok(acertouJogador('la pulga', MESSI))
  assert.equal(acertouJogador('Ronaldo', RONALDINHO), false)
  assert.equal(acertouJogador('me', MESSI), false)
})

test('quem é: foto clareia e pontos caem a cada erro', () => {
  assert.ok(blurFoto(0) > blurFoto(1) && blurFoto(3) > blurFoto(4))
  assert.equal(blurFoto(99), blurFoto(4))
  assert.equal(pontosQuemE(0), 1000)
  assert.equal(pontosQuemE(4), 200)
  assert.equal(pontosQuemE(5), 0)
})

test('figurinhas: campanha dá mais nos níveis altos e nada se reprovar', () => {
  assert.deepEqual(recompensa('campanha', { acertos: 2, dificuldade: 3 }), { n: 0, brilhantes: 0 })
  assert.deepEqual(recompensa('campanha', { acertos: 3, dificuldade: 1 }), { n: 1, brilhantes: 0 })
  assert.deepEqual(recompensa('campanha', { acertos: 5, dificuldade: 3 }), { n: 3, brilhantes: 1 })
  assert.equal(recompensa('sobrevivencia', { acertos: 7 }).n, 2)
  assert.equal(recompensa('sobrevivencia', { acertos: 40 }).n, 5)
  assert.equal(recompensa('pvp', { venceu: true }).n, 3)
  assert.equal(recompensa('pvp', { venceu: false }).n, 1)
})

test('figurinhas: pacote e colagem marcam novas, repetidas e brilhantes', () => {
  const seq = [0, 0.99, 0]
  const pacote = abrirPacote(['a', 'b'], { n: 3, brilhantes: 1 }, () => seq.shift())
  assert.deepEqual(pacote.map((f) => f.id), ['a', 'b', 'a'])
  assert.equal(pacote[0].brilhante, true)
  const { colecao, resultado } = colar({}, pacote)
  assert.deepEqual(resultado.map((f) => f.nova), [true, true, false])
  assert.deepEqual(colecao.a, { qtd: 2, brilhante: true })
})

import { setor, comparar } from '../src/logic.js'

test('quem é: comparação por país e setor (estilo Who Are Ya)', () => {
  assert.equal(setor('Centroavante'), 'Ataque')
  assert.equal(setor('Meia-atacante'), 'Meio-campo')
  assert.equal(setor('Lateral-direito'), 'Defesa')
  assert.equal(setor('Zagueiro (líbero)'), 'Defesa')
  assert.equal(setor('Goleiro'), 'Goleiro')
  const maradona = { pais: 'Argentina', posicao: 'Meia-atacante' }
  assert.deepEqual(comparar({ pais: 'Argentina', posicao: 'Atacante' }, maradona), { pais: true, setor: false })
  assert.deepEqual(comparar({ pais: 'Brasil', posicao: 'Meia' }, maradona), { pais: false, setor: true })
})

import { filtroCaricatura } from '../src/logic.js'

test('quem é: caricatura começa como silhueta e só fica nítida no 3º erro', () => {
  assert.equal(filtroCaricatura(0), 'brightness(0)')
  assert.equal(filtroCaricatura(1), 'brightness(0)')
  assert.match(filtroCaricatura(2), /blur/)
  assert.equal(filtroCaricatura(3), 'none')
})
