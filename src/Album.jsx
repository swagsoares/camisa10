import JOGADORES from '../api/jogadores.json'

const POR_ID = Object.fromEntries(JOGADORES.map((j) => [j.id, j]))

function Figurinha({ j, brilhante, qtd, numero }) {
  if (!j) return <div className="figurinha vazia"><span>{numero}</span><small>?</small></div>
  return (
    <div className={`figurinha ${brilhante ? 'brilhante' : ''}`}>
      <img src={j.foto} alt={j.nome} loading="lazy" referrerPolicy="no-referrer" />
      <div className="fig-info"><b>{j.bandeira} {j.nome}</b><small>{j.posicao}</small></div>
      {qtd > 1 && <span className="repetidas">x{qtd}</span>}
    </div>
  )
}

// Modo Figurinha: álbum com os 24 craques. Figurinhas vêm de todos os modos de jogo.
export default function Album({ colecao, voltar }) {
  const coladas = JOGADORES.filter((j) => colecao[j.id]).length
  const brilhantes = JOGADORES.filter((j) => colecao[j.id]?.brilhante).length
  return (
    <div className="tela">
      <h1 className="titulo-tela">🎴 ÁLBUM DE FIGURINHAS</h1>
      <p className="dica">{coladas}/{JOGADORES.length} coladas · {brilhantes} ✨ brilhantes · ganhe pacotinhos passando fases, na sobrevivência, no PvP e acertando o "Quem é esse jogador?"</p>
      <div className="barra album-barra"><div style={{ width: `${(100 * coladas) / JOGADORES.length}%` }} /></div>
      <div className="album">
        {JOGADORES.map((j, i) => (
          <Figurinha key={j.id} numero={i + 1} j={colecao[j.id] && j} {...colecao[j.id]} />
        ))}
      </div>
      {coladas === JOGADORES.length && <p className="dica">🏆 ÁLBUM COMPLETO! Você é um craque de verdade.</p>}
      <button className="btn cinza" onClick={voltar}>Voltar ao menu</button>
    </div>
  )
}

// Abertura do pacotinho: as figurinhas viram uma a uma (animação CSS), marcando novas e repetidas.
export function Pacote({ figurinhas, fechar }) {
  return (
    <div className="overlay" onClick={fechar}>
      <div className="painel pacote" onClick={(e) => e.stopPropagation()}>
        <h2>🎁 Pacotinho de figurinhas!</h2>
        <div className="pacote-cartas">
          {figurinhas.map((f, i) => (
            <div key={i} className="carta" style={{ animationDelay: `${i * 0.25}s` }}>
              <Figurinha j={POR_ID[f.id]} brilhante={f.brilhante} />
              <span className={`etiqueta ${f.nova ? 'nova' : ''}`}>{f.nova ? 'NOVA!' : 'repetida'}</span>
            </div>
          ))}
        </div>
        <button className="btn verde" autoFocus onClick={fechar}>Colar no álbum</button>
      </div>
    </div>
  )
}
