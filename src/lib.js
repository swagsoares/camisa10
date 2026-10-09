import { createClient } from '@supabase/supabase-js'

// Sem as variáveis o jogo ainda abre; só ranking/PvP falham (com mensagem), em vez de tela branca.
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL || 'http://localhost', import.meta.env.VITE_SUPABASE_ANON_KEY || 'sem-chave')

export async function api(caminho, corpo) {
  const r = await fetch(`/api/${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  })
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).detail || `Erro ${r.status}`)
  return r.json()
}

// localStorage pode falhar (aba anônima, bloqueio); o jogo funciona sem ele.
export const salvo = {
  ler: (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) ?? padrao } catch { return padrao } },
  gravar: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* sem persistência */ } },
}

// Feedback sonoro sintetizado (sem arquivos de áudio).
let ctx
export function som(tipo) {
  if (salvo.ler('som', true) === false) return // desligado nas Configurações
  try {
    ctx ??= new AudioContext()
    const notas = { acerto: [523, 784], erro: [220, 147], fim: [523, 659, 784, 1047] }[tipo]
    notas.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = tipo === 'erro' ? 'sawtooth' : 'triangle'
      o.frequency.value = f
      const t = ctx.currentTime + i * 0.12
      g.gain.setValueAtTime(0.15, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + 0.25)
    })
  } catch { /* navegador sem áudio */ }
}
