import { useEffect, useRef, useState } from 'react'
import Quiz from './Quiz'
import { api, som, supabase } from './lib'
import { BLOCOS, NIVEIS, ordenarPlacar } from './logic'

// Modo PvP online (estilo Kahoot): mesmo lote de 5 perguntas para todos da sala.
// Lobby via Supabase Realtime Presence; início via Broadcast; placar via Postgres Changes.
export default function Pvp({ filtros, nome, setNome, aoSair }) {
  const [fase, setFase] = useState('entrada') // entrada | lobby | jogo | placar
  const [sala, setSala] = useState(null)
  const [anfitriao, setAnfitriao] = useState(false)
  const [jogadores, setJogadores] = useState([])
  const [resultados, setResultados] = useState([])
  const [codigo, setCodigo] = useState('')
  const [msg, setMsg] = useState('')
  const canal = useRef(null)

  async function entrar(code, criou = false) {
    setMsg('Entrando na sala…')
    const { data, error } = await supabase.from('rooms').select('*').eq('code', code.toUpperCase()).maybeSingle()
    if (error || !data) return setMsg('Sala não encontrada. Confira o código.')
    setAnfitriao(criou)
    setSala(data)
    setFase('lobby')
    setMsg('')
  }

  async function criar() {
    setMsg('A IA está gerando o lote de perguntas da sala…')
    try {
      const { code } = await api('salas', { categoria: filtros.categoria, dificuldade: filtros.dificuldade })
      await entrar(code, true)
    } catch (e) {
      setMsg(`Erro ao criar sala: ${e.message}`)
    }
  }

  useEffect(() => {
    if (!sala) return
    const ch = supabase.channel(`sala-${sala.code}`, { config: { presence: { key: `${nome}-${Math.random()}` } } })
    ch.on('presence', { event: 'sync' }, () => setJogadores(Object.values(ch.presenceState()).map((p) => p[0].nome)))
      .on('broadcast', { event: 'start' }, () => setFase('jogo'))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_results', filter: `code=eq.${sala.code}` },
        (e) => setResultados((r) => (r.some((x) => x.id === e.new.id) ? r : [...r, e.new])))
      .subscribe((status) => status === 'SUBSCRIBED' && ch.track({ nome }))
    canal.current = ch
    supabase.from('room_results').select('*').eq('code', sala.code).then(({ data }) => data && setResultados(data))
    return () => { supabase.removeChannel(ch) }
  }, [sala]) // eslint-disable-line react-hooks/exhaustive-deps

  function comecar() {
    canal.current.send({ type: 'broadcast', event: 'start', payload: {} })
    setFase('jogo')
  }

  async function terminar(p) {
    som('fim')
    setFase('placar')
    await supabase.from('room_results').insert({ code: sala.code, nome, acertos: p.acertos, pontos: p.pontos, tempo_ms: p.tempo_ms })
  }

  if (fase === 'jogo')
    return (
      <Quiz titulo={`PVP · SALA ${sala.code}`} total={sala.questions.length} comTimer
        carregar={(i) => Promise.resolve(sala.questions[i])} aoFim={terminar} aoSair={aoSair} />
    )

  const cat = BLOCOS.find((b) => b.id === filtros.categoria)?.nome ?? 'Todas as categorias'
  return (
    <div className="tela centro">
      <div className="painel">
        <h1>⚔️ Modo PvP</h1>
        {fase === 'entrada' && (
          <>
            <label>Seu nome<input value={nome} maxLength={20} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Vitor" /></label>
            <p className="dica">Nova sala usa os filtros atuais: <b>{cat}</b> · <b>{NIVEIS[filtros.dificuldade - 1]}</b></p>
            <button className="btn azul" disabled={!nome.trim()} onClick={criar}>Criar sala</button>
            <div className="linha">
              <input value={codigo} maxLength={4} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="CÓDIGO" />
              <button className="btn verde" disabled={!nome.trim() || codigo.length !== 4} onClick={() => entrar(codigo)}>Entrar</button>
            </div>
          </>
        )}
        {fase === 'lobby' && (
          <>
            <p>Código da sala:</p>
            <div className="codigo-sala">{sala.code}</div>
            <p className="dica">Mande esse código pro seu adversário 👆</p>
            <ul className="jogadores">{jogadores.map((j, i) => <li key={i}>👤 {j}</li>)}</ul>
            {anfitriao
              ? <button className="btn verde" disabled={jogadores.length < 2} onClick={comecar}>{jogadores.length < 2 ? 'Aguardando adversário…' : 'Começar partida!'}</button>
              : <p className="dica">Aguardando o anfitrião começar…</p>}
          </>
        )}
        {fase === 'placar' && (
          <>
            <h2>Placar da sala {sala.code}</h2>
            <ol className="placar">
              {ordenarPlacar(resultados).map((r, i) => (
                <li key={r.id} className={i === 0 ? 'lider' : ''}>
                  <span>{i === 0 ? '🏆' : `${i + 1}º`} {r.nome}</span>
                  <span>{r.acertos}/{sala.questions.length} · {r.pontos} pts · {(r.tempo_ms / 1000).toFixed(1)}s</span>
                </li>
              ))}
            </ol>
            {resultados.length < jogadores.length && <p className="dica">Aguardando {jogadores.length - resultados.length} jogador(es) terminar…</p>}
          </>
        )}
        {msg && <p className="dica">{msg}</p>}
        <button className="btn cinza" onClick={aoSair}>Voltar ao menu</button>
      </div>
    </div>
  )
}
