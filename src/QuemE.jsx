import { useEffect, useState } from 'react'
import JOGADORES from '../api/jogadores.json'
import { api, som, supabase } from './lib'
import { CHUTES_MAX, acertouJogador, blurFoto, comparar, pontosQuemE, setor } from './logic'

const RODADAS = 5
const sortear = () => [...JOGADORES].sort(() => Math.random() - 0.5).slice(0, RODADAS)

// Modo "Quem é esse jogador?": dicas da IA (texto) + caricatura do Gemini (imagem) + foto real que clareia.
// ponytail: nomes e fotos estão no bundle (dá para "colar" pelo devtools); servidor só se virar competitivo.
export default function QuemE({ aoGanhar, aoSair, nome, setNome, verRanking }) {
  const [fila] = useState(sortear)
  const [idx, setIdx] = useState(0)
  const [dicas, setDicas] = useState(null)
  const [erros, setErros] = useState(0)
  const [chute, setChute] = useState('')
  const [status, setStatus] = useState('jogando') // jogando | acertou | errou
  const [placar, setPlacar] = useState({ pontos: 0, acertos: 0 })
  const [tremer, setTremer] = useState(false)
  const [temCaricatura, setTemCaricatura] = useState(true)
  const [salvou, setSalvou] = useState(false)
  const [chutes, setChutes] = useState([]) // chutes errados que são jogadores do jogo -> viram pistas
  const j = fila[idx]

  useEffect(() => {
    setDicas(null)
    setTemCaricatura(true)
    api('dicas', { jogador: j.id }).then(setDicas).catch(() => setDicas({ dicas: j.pistas, fonte: 'curadas' }))
  }, [j])

  function chutar(e) {
    e.preventDefault()
    if (!chute.trim() || status !== 'jogando') return
    if (acertouJogador(chute, j)) {
      som('acerto')
      setStatus('acertou')
      setPlacar((p) => ({ pontos: p.pontos + pontosQuemE(erros), acertos: p.acertos + 1 }))
      aoGanhar([{ id: j.id, brilhante: erros <= 1 }]) // acertou rápido = figurinha brilhante
    } else {
      const outro = JOGADORES.find((x) => x.id !== j.id && acertouJogador(chute, x))
      setChutes((c) => [...c, outro ? { ...outro, ...comparar(outro, j) } : { nome: chute.trim() }])
      som('erro')
      setTremer(true)
      setTimeout(() => setTremer(false), 400)
      if (erros + 1 >= CHUTES_MAX) setStatus('errou')
      setErros(erros + 1)
    }
    setChute('')
  }

  function proximo() {
    setIdx(idx + 1)
    setErros(0)
    setChutes([])
    setStatus('jogando')
  }

  if (idx >= RODADAS)
    return (
      <div className="tela centro">
        <div className="painel entrar">
          <img className="mascote-pequeno" src="/assets/mascote.png" alt="" />
          <h1>Fim do desafio!</h1>
          <div className="stats">
            <div><b>{placar.acertos}/{RODADAS}</b><small>jogadores</small></div>
            <div><b>{placar.pontos}</b><small>pontos</small></div>
          </div>
          {salvou === true ? <p className="dica">Salvo no ranking ✅</p> : (
            <div className="linha">
              <input value={nome} maxLength={20} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
              <button className="btn amarelo" disabled={!nome.trim()} onClick={async () => {
                const { error } = await supabase.from('scores').insert({ nome: nome.trim(), modo: 'quem', pontos: placar.pontos })
                setSalvou(error ? 'erro' : true)
              }}>Salvar no ranking</button>
            </div>
          )}
          {salvou === 'erro' && <p className="dica">Não foi possível salvar agora.</p>}
          <button className="btn azul" onClick={verRanking}>Ver ranking</button>
          <button className="btn cinza" onClick={aoSair}>Menu</button>
        </div>
      </div>
    )

  const fim = status !== 'jogando'
  const reveladas = fim ? CHUTES_MAX : erros + 1
  return (
    <div className="tela quem-e">
      <header className="hud">
        <div>
          <div className="hud-titulo">QUEM É ESSE JOGADOR? · {idx + 1}/{RODADAS}</div>
          <div className="barra"><div style={{ width: `${(100 * (idx + fim)) / RODADAS}%` }} /></div>
        </div>
        <div className="hud-centro"><b>{placar.pontos} PTS</b><small>valendo {pontosQuemE(erros)} · {CHUTES_MAX - erros} chutes</small></div>
        <button className="sair" onClick={aoSair}>✕</button>
      </header>

      <div className="quem-corpo">
        <div className="quem-imagens">
          {temCaricatura && (
            <figure className="quadro caricatura">
              <img src={`/assets/caricaturas/${j.id}.png`} alt="Caricatura do jogador misterioso" onError={() => setTemCaricatura(false)} />
              <figcaption>🎨 Caricatura (IA · Gemini)</figcaption>
            </figure>
          )}
          <figure className={`quadro ${tremer ? 'tremendo' : ''}`}>
            <img src={j.foto} alt={fim ? j.nome : 'Foto borrada do jogador misterioso'} referrerPolicy="no-referrer"
              style={{ filter: fim ? 'none' : `blur(${blurFoto(erros)}px) grayscale(${erros < 2 ? 1 : 0})` }} />
            <figcaption>{fim ? <a href={j.credito} target="_blank" rel="noreferrer">📷 Foto: Wikimedia Commons</a> : '📷 A foto clareia a cada chute errado'}</figcaption>
          </figure>
        </div>

        <div className="painel quem-dicas">
          <h3>Dicas {dicas && <span className={`selo ${dicas.fonte === 'ia' ? 'ia' : 'cache'}`}>{dicas.fonte === 'ia' ? '🤖 narradas pela IA' : '📋 dicas do grupo'}</span>}</h3>
          {!dicas ? <p className="dica">A IA está preparando as dicas…</p> : (
            <ol className="lista-dicas">
              {dicas.dicas.map((d, i) => <li key={i} className={i < reveladas ? 'aberta' : ''}>{i < reveladas ? d : '🔒 Erre um chute para liberar'}</li>)}
            </ol>
          )}
          {chutes.length > 0 && (
            <ul className="chutes">
              {chutes.map((c, i) => (
                <li key={i}>
                  <span className="chute-nome">❌ {c.nome}</span>
                  {c.pais !== undefined ? (
                    <>
                      <span className={`pista ${c.pais ? 'sim' : 'nao'}`}>{c.bandeira} {c.pais ? 'mesmo país' : 'outro país'}</span>
                      <span className={`pista ${c.setor ? 'sim' : 'nao'}`}>{setor(c.posicao)} {c.setor ? '= mesmo setor' : '≠ outro setor'}</span>
                    </>
                  ) : <span className="pista neutra">fora do álbum, sem comparação</span>}
                </li>
              ))}
            </ul>
          )}
          {fim ? (
            <div className={`feedback ${status === 'acertou' ? 'ok' : 'nok'}`}>
              <b>{status === 'acertou' ? `Golaço! É ${j.nome} ${j.bandeira}` : `Era ${j.nome} ${j.bandeira}!`}</b>
              <p>{status === 'acertou' ? `Figurinha${erros <= 1 ? ' ✨ BRILHANTE' : ''} de ${j.nome} no seu álbum!` : 'Na próxima você acerta.'}</p>
              <button className="btn verde" autoFocus onClick={proximo}>{idx + 1 < RODADAS ? 'Próximo jogador ➜' : 'Ver resultado'}</button>
            </div>
          ) : (
            <form className="linha" onSubmit={chutar}>
              <input list="nomes-jogadores" value={chute} onChange={(e) => setChute(e.target.value)} placeholder="Seu chute…" autoFocus />
              <datalist id="nomes-jogadores">{JOGADORES.map((x) => <option key={x.id} value={x.nome} />)}</datalist>
              <button className="btn amarelo" disabled={!chute.trim()}>Chutar ⚽</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
