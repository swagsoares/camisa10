import { useEffect, useRef, useState } from 'react'
import Quiz from './Quiz'
import Pvp from './Pvp'
import QuemE from './QuemE'
import Album, { Pacote } from './Album'
import JOGADORES from '../api/jogadores.json'
import { api, salvo, som, supabase } from './lib'
import { BLOCOS, FASES, NIVEIS, PERGUNTAS_POR_FASE, ACERTOS_PARA_PASSAR, dificuldadeSobrevivencia, faseAprovada, faseLiberada, recompensa, abrirPacote, colar } from './logic'

const IDS = JOGADORES.map((j) => j.id)

export default function App() {
  const [tela, setTela] = useState('menu')
  const [filtros, setFiltros] = useState(() => salvo.ler('filtros', { categoria: 'craques', dificuldade: 2, modo: 'campanha' }))
  const [concluidas, setConcluidas] = useState(() => salvo.ler('concluidas', []))
  const [nome, setNome] = useState(() => salvo.ler('nome', ''))
  const [partida, setPartida] = useState(null) // { tipo, fase?, ... }
  const [resultado, setResultado] = useState(null)
  // ponytail: álbum fica no navegador (localStorage); sincronizar entre aparelhos exigiria login.
  const [colecao, setColecao] = useState(() => salvo.ler('album', {}))
  const [pacote, setPacote] = useState(null)

  useEffect(() => salvo.gravar('filtros', filtros), [filtros])
  useEffect(() => salvo.gravar('concluidas', concluidas), [concluidas])
  useEffect(() => salvo.gravar('nome', nome), [nome])
  useEffect(() => salvo.gravar('album', colecao), [colecao])

  function ganhar(figurinhas) {
    if (!figurinhas.length) return
    const r = colar(colecao, figurinhas)
    setColecao(r.colecao)
    setPacote(r.resultado)
  }
  const ganharPacote = (premio) => ganhar(abrirPacote(IDS, premio))

  const ir = (t) => setTela(t)
  const jogarFase = (fase) => { setPartida({ id: Date.now(), tipo: 'campanha', fase }); ir('jogo') }
  const jogarSobrevivencia = () => { setPartida({ id: Date.now(), tipo: 'sobrevivencia', ...filtros }); ir('jogo') }

  function iniciarPelosFiltros() {
    if (filtros.modo === 'campanha') ir('trilha')
    else if (filtros.modo === 'pvp') ir('pvp')
    else if (filtros.modo === 'quem') ir('quem')
    else jogarSobrevivencia()
  }

  function apagarProgresso() {
    setConcluidas([])
    setColecao({})
  }

  function fim(placar) {
    som('fim')
    if (partida.tipo === 'campanha' && faseAprovada(placar.acertos) && !concluidas.includes(partida.fase.id))
      setConcluidas([...concluidas, partida.fase.id])
    ganharPacote(partida.tipo === 'campanha'
      ? recompensa('campanha', { acertos: placar.acertos, dificuldade: partida.fase.dificuldade })
      : recompensa('sobrevivencia', placar))
    setResultado({ ...placar, partida })
    ir('resultado')
  }

  return (
    <div className="app">
      {tela === 'menu' && <Menu ir={ir} jogarSobrevivencia={jogarSobrevivencia} coladas={Object.keys(colecao).length} />}
      {tela === 'filtros' && <Filtros filtros={filtros} setFiltros={setFiltros} iniciar={iniciarPelosFiltros} voltar={() => ir('menu')}
        nome={nome} setNome={setNome} apagarProgresso={apagarProgresso} />}
      {tela === 'trilha' && <Trilha concluidas={concluidas} jogar={jogarFase} voltar={() => ir('menu')} />}
      {tela === 'jogo' && <Partida key={partida.id} partida={partida} aoFim={fim} aoSair={() => ir('menu')} />}
      {tela === 'resultado' && (
        <Resultado r={resultado} nome={nome} setNome={setNome} ir={ir}
          proxima={() => { const i = FASES.indexOf(resultado.partida.fase); FASES[i + 1] ? jogarFase(FASES[i + 1]) : ir('trilha') }}
          repetir={() => (resultado.partida.tipo === 'campanha' ? jogarFase(resultado.partida.fase) : jogarSobrevivencia())} />
      )}
      {tela === 'ranking' && <Ranking voltar={() => ir('menu')} />}
      {tela === 'pvp' && <Pvp filtros={filtros} nome={nome} setNome={setNome} aoSair={() => ir('menu')}
        aoTerminar={(venceu) => ganharPacote(recompensa('pvp', { venceu }))} />}
      {tela === 'quem' && <QuemE aoGanhar={ganhar} aoSair={() => ir('menu')} nome={nome} setNome={setNome} verRanking={() => ir('ranking')} />}
      {tela === 'album' && <Album colecao={colecao} voltar={() => ir('menu')} />}
      {pacote && <Pacote figurinhas={pacote} fechar={() => setPacote(null)} />}
    </div>
  )
}

function Menu({ ir, jogarSobrevivencia, coladas }) {
  return (
    <div className="tela menu">
      <div className="logo"><h1>CAMISA 10</h1><h2>A Trilha do Craque</h2></div>
      <div className="menu-corpo">
        <nav className="menu-botoes">
          <button className="btn verde grande" onClick={() => ir('trilha')}>JOGAR (Campanha)</button>
          <button className="btn azul grande" onClick={() => ir('pvp')}>MODO PVP</button>
          <button className="btn vermelho grande" onClick={jogarSobrevivencia}>MODO SOBREVIVÊNCIA</button>
          <button className="btn amarelo grande" onClick={() => ir('quem')}>QUEM É ESSE JOGADOR?</button>
          <button className="btn cinza grande" onClick={() => ir('filtros')}>FILTROS E CONFIGURAÇÕES</button>
          <div className="linha">
            <button className="btn roxo" onClick={() => ir('album')}>🎴 Álbum ({coladas}/{IDS.length})</button>
            <button className="btn roxo" onClick={() => ir('ranking')}>🏆 Ranking</button>
          </div>
        </nav>
        <img className="mascote" src="/assets/mascote.png" alt="Mascote do Camisa 10" />
      </div>
    </div>
  )
}

const MODOS = [
  { id: 'campanha', nome: 'Campanha', icone: '🗺️', cor: 'verde', desc: 'Avance pela trilha de 12 fases.', filtros: false },
  { id: 'pvp', nome: 'PvP', icone: '⚔️', cor: 'azul', desc: 'Desafie um amigo com código de sala.', filtros: true },
  { id: 'sobrevivencia', nome: 'Sobrevivência', icone: '⏱️', cor: 'vermelho', desc: '20 s por pergunta. Errou, acabou.', filtros: true },
  { id: 'quem', nome: 'Quem é esse jogador?', icone: '🕵️', cor: 'amarelo', desc: 'Descubra o craque pelas dicas.', filtros: false },
]

// Tela 3 do mockup da CP4: primeiro o modo, depois os filtros que esse modo usa, depois as configurações.
function Filtros({ filtros, setFiltros, iniciar, voltar, nome, setNome, apagarProgresso }) {
  const [somLigado, setSomLigado] = useState(() => salvo.ler('som', true))
  const [apagado, setApagado] = useState(false)
  const set = (k, v) => setFiltros({ ...filtros, [k]: v })
  const modo = MODOS.find((m) => m.id === filtros.modo) ?? MODOS[0]
  const alternarSom = () => { salvo.gravar('som', !somLigado); setSomLigado(!somLigado) }

  return (
    <div className="tela filtros">
      <h1 className="titulo-tela">ESCOLHA SUA PARTIDA</h1>

      <section className="painel largo">
        <h3 className="amarelo-txt">1. MODO DE JOGO</h3>
        <div className="modos">
          {MODOS.map((m) => (
            <button key={m.id} className={`modo ${m.cor} ${m.id === modo.id ? 'escolhido' : ''}`} onClick={() => set('modo', m.id)} aria-pressed={m.id === modo.id}>
              <span className="modo-icone">{m.icone}</span>
              <b>{m.nome}</b>
              <small>{m.desc}</small>
              {m.id === modo.id && <span className="check">✓</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="painel claro largo">
        <h3>2. FILTROS</h3>
        {modo.filtros ? (
          <>
            <h4>Categoria</h4>
            <div className="chips">
              <button className={`chip ${!filtros.categoria ? 'ativo verde' : ''}`} onClick={() => set('categoria', null)}>🎲 Todas</button>
              {BLOCOS.map((b) => (
                <button key={b.id} className={`chip ${filtros.categoria === b.id ? 'ativo verde' : ''}`} onClick={() => set('categoria', b.id)}>{b.icone} {b.nome}</button>
              ))}
            </div>
            <h4>Dificuldade {modo.id === 'sobrevivencia' && <small className="dica escura">(inicial; sobe a cada 3 acertos)</small>}</h4>
            <div className="chips">
              {NIVEIS.map((n, i) => (
                <button key={n} className={`chip ${filtros.dificuldade === i + 1 ? 'ativo amarelo' : ''}`} onClick={() => set('dificuldade', i + 1)}>{n}</button>
              ))}
            </div>
          </>
        ) : (
          <p className="dica escura">{modo.id === 'campanha' ? '🗺️ Na campanha, a trilha define o tema e o nível de cada fase.' : '🕵️ Os 24 craques são sorteados a cada partida.'}</p>
        )}
        <button className={`btn grande ${modo.cor}`} onClick={iniciar}>INICIAR {modo.nome.toUpperCase()} ➜</button>
      </section>

      <details className="painel largo config">
        <summary><h3>⚙️ CONFIGURAÇÕES</h3></summary>
        <label>Seu nome (ranking e PvP)
          <input value={nome} maxLength={20} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Vitor" />
        </label>
        <div className="linha config-linha">
          <span>Efeitos sonoros</span>
          <button className={`btn ${somLigado ? 'verde' : 'cinza'}`} onClick={alternarSom} aria-pressed={somLigado}>{somLigado ? '🔊 Ligado' : '🔇 Desligado'}</button>
        </div>
        <div className="linha config-linha">
          <span>Apagar progresso (trilha e álbum)</span>
          <button className="btn vermelho" disabled={apagado} onClick={() => {
            if (window.confirm('Apagar as fases concluídas e todas as figurinhas? Não dá para desfazer.')) { apagarProgresso(); setApagado(true) }
          }}>{apagado ? 'Apagado ✓' : '🗑️ Apagar'}</button>
        </div>
      </details>

      <button className="btn cinza" onClick={voltar}>Voltar ao menu</button>
    </div>
  )
}

function Trilha({ concluidas, jogar, voltar }) {
  return (
    <div className="tela trilha">
      <h1 className="titulo-tela">A TRILHA DO CRAQUE</h1>
      <div className="blocos">
        {BLOCOS.map((b, bi) => (
          <div key={b.id} className="bloco">
            <h3>Bloco {bi + 1}: {b.icone} {b.nome}</h3>
            <div className="nos">
              {FASES.filter((f) => f.bloco === b).map((f) => {
                const i = FASES.indexOf(f)
                const ok = concluidas.includes(f.id)
                const livre = faseLiberada(i, concluidas)
                return (
                  <button key={f.id} className={`no ${ok ? 'feito' : livre ? 'livre' : 'trancado'}`} disabled={!livre} onClick={() => jogar(f)}
                    title={NIVEIS[f.dificuldade - 1]}>
                    {ok ? '★' : livre ? f.dificuldade : '🔒'}
                    <small>{NIVEIS[f.dificuldade - 1]}</small>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="dica">Acerte {ACERTOS_PARA_PASSAR} de {PERGUNTAS_POR_FASE} para liberar a próxima fase. {concluidas.length}/{FASES.length} concluídas.</p>
      <button className="btn cinza" onClick={voltar}>Voltar ao menu</button>
    </div>
  )
}

// Conecta o modo de jogo à fonte de perguntas.
function Partida({ partida, aoFim, aoSair }) {
  const usados = useRef([])
  const lote = useRef(null)

  if (partida.tipo === 'campanha') {
    const { fase } = partida
    const carregar = (i) => {
      lote.current ??= api('perguntas', { categoria: fase.categoria, dificuldade: fase.dificuldade, quantidade: PERGUNTAS_POR_FASE })
      lote.current.catch(() => { lote.current = null }) // permite "tentar de novo"
      return lote.current.then((l) => l[i] ?? null)
    }
    return <Quiz titulo={`BLOCO ${fase.numeroBloco}: ${fase.bloco.nome.toUpperCase()} · ${NIVEIS[fase.dificuldade - 1]}`}
      total={PERGUNTAS_POR_FASE} carregar={carregar} aoFim={aoFim} aoSair={aoSair} />
  }

  const cat = BLOCOS.find((b) => b.id === partida.categoria)
  const carregar = (_, acertos) =>
    api('perguntas', {
      categoria: partida.categoria, quantidade: 1, excluir: usados.current,
      dificuldade: dificuldadeSobrevivencia(partida.dificuldade, acertos),
    }).then(([q]) => { usados.current.push(q.fact_id); return q })
  return <Quiz titulo={`SOBREVIVÊNCIA · ${cat ? cat.nome.toUpperCase() : 'TODAS'}`} total={Infinity} comTimer morteSubita
    carregar={carregar} aoFim={aoFim} aoSair={aoSair} />
}

function Resultado({ r, nome, setNome, ir, proxima, repetir }) {
  const [salvou, setSalvou] = useState(false)
  const campanha = r.partida.tipo === 'campanha'
  const passou = campanha && faseAprovada(r.acertos)

  async function salvar() {
    const { error } = await supabase.from('scores').insert({ nome: nome.trim(), modo: 'sobrevivencia', pontos: r.pontos })
    setSalvou(error ? 'erro' : true)
  }

  return (
    <div className="tela centro">
      <div className="painel entrar">
        <img className="mascote-pequeno" src="/assets/mascote.png" alt="" />
        <h1>{campanha ? (passou ? 'Fase concluída! 🎉' : 'Quase lá!') : 'Fim da linha!'}</h1>
        <div className="stats">
          <div><b>{r.acertos}</b><small>acertos</small></div>
          <div><b>{r.pontos}</b><small>pontos</small></div>
          <div><b>{r.melhorSeq}</b><small>melhor sequência</small></div>
        </div>
        {campanha && !passou && <p className="dica">Você precisa de {ACERTOS_PARA_PASSAR} acertos para avançar.</p>}
        {!campanha && (salvou === true ? <p className="dica">Salvo no ranking ✅</p> : (
          <div className="linha">
            <input value={nome} maxLength={20} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" />
            <button className="btn amarelo" disabled={!nome.trim()} onClick={salvar}>Salvar no ranking</button>
          </div>
        ))}
        {salvou === 'erro' && <p className="dica">Não foi possível salvar agora.</p>}
        {passou ? <button className="btn verde" onClick={proxima}>Próxima fase ➜</button> : <button className="btn verde" onClick={repetir}>Jogar de novo</button>}
        {campanha && <button className="btn azul" onClick={() => ir('trilha')}>Ver trilha</button>}
        {!campanha && <button className="btn azul" onClick={() => ir('ranking')}>Ver ranking</button>}
        <button className="btn cinza" onClick={() => ir('menu')}>Menu</button>
      </div>
    </div>
  )
}

const MODOS_RANKING = [['sobrevivencia', 'Sobrevivência'], ['quem', 'Quem é esse jogador?']]

function Ranking({ voltar }) {
  const [modo, setModo] = useState('sobrevivencia')
  const [linhas, setLinhas] = useState(null)
  useEffect(() => {
    setLinhas(null)
    supabase.from('scores').select('nome,pontos,created_at').eq('modo', modo).order('pontos', { ascending: false }).limit(10)
      .then(({ data, error }) => setLinhas(error ? [] : data))
  }, [modo])
  return (
    <div className="tela centro">
      <div className="painel">
        <h1>🏆 Ranking</h1>
        <div className="chips">
          {MODOS_RANKING.map(([id, rot]) => (
            <button key={id} className={`chip ${modo === id ? 'ativo amarelo' : ''}`} onClick={() => setModo(id)}>{rot}</button>
          ))}
        </div>
        {!linhas ? <p>Carregando…</p> : linhas.length === 0 ? <p className="dica">Ninguém no ranking ainda. Seja o primeiro!</p> : (
          <ol className="placar">
            {linhas.map((l, i) => <li key={i} className={i === 0 ? 'lider' : ''}><span>{i + 1}º {l.nome}</span><span>{l.pontos} pts</span></li>)}
          </ol>
        )}
        <button className="btn cinza" onClick={voltar}>Voltar</button>
      </div>
    </div>
  )
}
