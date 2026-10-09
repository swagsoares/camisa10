import { useEffect, useRef, useState } from 'react'
import { pontos, sequenciaApos, TEMPO_LIMITE_MS } from './logic'
import { som } from './lib'

// Tela de gameplay (mockup CP4, tela 2). O modo de jogo decide de onde vêm as perguntas.
// carregar(i, acertos) -> Promise<pergunta | null>; null = acabaram as perguntas.
export default function Quiz({ titulo, total, carregar, comTimer, morteSubita, aoFim, aoSair }) {
  const [idx, setIdx] = useState(0)
  const [pergunta, setPergunta] = useState(null)
  const [erro, setErro] = useState(null)
  const [escolhida, setEscolhida] = useState(undefined) // undefined = ainda respondendo; null = tempo esgotado
  const [placar, setPlacar] = useState({ acertos: 0, sequencia: 0, melhorSeq: 0, pontos: 0, tempo_ms: 0 })
  const [restante, setRestante] = useState(TEMPO_LIMITE_MS)
  const inicio = useRef(0)
  const proxima = useRef(null)

  const buscar = (i, acertos) => {
    setErro(null)
    setPergunta(null)
    const p = proxima.current?.i === i ? proxima.current.p : carregar(i, acertos)
    proxima.current = null
    p.then((q) => (q ? setPergunta(q) : aoFim(placar))).catch((e) => setErro(e.message))
  }

  useEffect(() => buscar(0, 0), []) // eslint-disable-line react-hooks/exhaustive-deps

  // Ao exibir uma pergunta: zera o relógio e já pré-busca a próxima (prefetch da CP4).
  useEffect(() => {
    if (!pergunta) return
    inicio.current = performance.now()
    setRestante(TEMPO_LIMITE_MS)
    if (idx + 1 < total) {
      const i = idx + 1
      const p = carregar(i, placar.acertos + 1) // em morte súbita só existe próxima se acertar
      p.catch(() => {})
      proxima.current = { i, p }
    }
  }, [pergunta]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!comTimer || !pergunta || escolhida !== undefined) return
    const t = setInterval(() => {
      const r = TEMPO_LIMITE_MS - (performance.now() - inicio.current)
      if (r <= 0) responder(null)
      else setRestante(r)
    }, 100)
    return () => clearInterval(t)
  }, [pergunta, escolhida, comTimer]) // eslint-disable-line react-hooks/exhaustive-deps

  function responder(alt) {
    if (escolhida !== undefined) return
    const tempo = Math.min(TEMPO_LIMITE_MS, performance.now() - inicio.current)
    const acertou = alt === pergunta.resposta_correta
    som(acertou ? 'acerto' : 'erro')
    setEscolhida(alt)
    setPlacar((s) => {
      const sequencia = sequenciaApos(s.sequencia, acertou)
      return {
        acertos: s.acertos + acertou,
        sequencia,
        melhorSeq: Math.max(s.melhorSeq, sequencia),
        pontos: s.pontos + pontos(acertou, comTimer ? tempo : 0),
        tempo_ms: s.tempo_ms + Math.round(tempo),
      }
    })
  }

  function continuar() {
    const errou = escolhida !== pergunta.resposta_correta
    setEscolhida(undefined)
    if ((morteSubita && errou) || idx + 1 >= total) return aoFim(placar)
    setIdx(idx + 1)
    buscar(idx + 1, placar.acertos)
  }

  const respondeu = escolhida !== undefined
  const segundos = Math.ceil(restante / 1000)
  return (
    <div className="tela gameplay">
      <header className="hud">
        <div>
          <div className="hud-titulo">{titulo}</div>
          <div className="barra"><div style={{ width: `${(100 * (idx + respondeu)) / (Number.isFinite(total) ? total : idx + 2)}%` }} /></div>
        </div>
        <div className="hud-centro">
          <b>SEQUÊNCIA <span className="bolha">{placar.sequencia}</span></b>
          <small>{Number.isFinite(total) ? `PERGUNTA ${idx + 1}/${total}` : `PERGUNTA ${idx + 1}`} · {placar.pontos} PTS</small>
        </div>
        {comTimer ? (
          <div className={`timer ${segundos <= 5 ? 'urgente' : ''}`}>{respondeu ? '—' : segundos}</div>
        ) : (
          <button className="sair" onClick={aoSair}>✕</button>
        )}
      </header>

      {erro ? (
        <div className="cartao-pergunta erro">
          <p>⚠️ Não consegui gerar a pergunta: {erro}</p>
          <button className="btn verde" onClick={() => buscar(idx, placar.acertos)}>Tentar de novo</button>
          <button className="btn cinza" onClick={aoSair}>Voltar ao menu</button>
        </div>
      ) : !pergunta ? (
        <div className="cartao-pergunta carregando"><div className="bola-girando">⚽</div>A IA está montando sua pergunta…</div>
      ) : (
        <div key={idx} className="entrar">
          <div className="cartao-pergunta">
            <span className={`selo ${pergunta.fonte}`}>{pergunta.fonte === 'ia' ? '🤖 Gerada agora pela IA (Llama)' : '📦 Do cache (IA indisponível)'}</span>
            <h2>{pergunta.pergunta}</h2>
          </div>
          <div className={`alternativas n${pergunta.alternativas.length}`}>
            {pergunta.alternativas.map((a, i) => {
              const estado = !respondeu ? '' : a === pergunta.resposta_correta ? 'certa' : a === escolhida ? 'errada' : 'apagada'
              return (
                <button key={a} className={`alt ${estado}`} disabled={respondeu} onClick={() => responder(a)}>
                  {pergunta.alternativas.length === 4 && `${'ABCD'[i]}) `}{a}
                </button>
              )
            })}
          </div>
          {respondeu && (
            <div className={`feedback ${escolhida === pergunta.resposta_correta ? 'ok' : 'nok'}`}>
              <b>{escolhida === pergunta.resposta_correta ? 'Golaço! ✅' : escolhida === null ? 'Tempo esgotado! ⏰' : 'Bola na trave… ❌'}</b>
              <p>{pergunta.explicacao}</p>
              <button className="btn verde" autoFocus onClick={continuar}>Continuar ➜</button>
            </div>
          )}
        </div>
      )}
      <img className="mascote-ajudante" src="/assets/mascote.png" alt="Mascote" />
    </div>
  )
}
