// Tiny synthesized sound kit (Web Audio, no files). Every sound is generated on the fly.
export type Sfx = 'click' | 'bet' | 'tick' | 'reveal' | 'card' | 'spin' | 'win' | 'bigwin' | 'lose' | 'cashout' | 'coin'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = true

export function setSfxEnabled(v: boolean) { enabled = v }

function ac() {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!C) return null
      ctx = new C()
      master = ctx.createGain()
      master.gain.value = 0.32
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  } catch { return null }
}

function tone(freq: number, at: number, dur: number, opts: { type?: OscillatorType; vol?: number; slide?: number; attack?: number } = {}) {
  const c = ac(); if (!c || !master) return
  const t = c.currentTime + at
  const o = c.createOscillator(), g = c.createGain()
  o.type = opts.type ?? 'sine'
  o.frequency.setValueAtTime(freq, t)
  if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * opts.slide), t + dur)
  const v = opts.vol ?? 0.5
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(v, t + (opts.attack ?? 0.005))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g); g.connect(master)
  o.start(t); o.stop(t + dur + 0.02)
}

function noise(at: number, dur: number, vol = 0.25, hp = 2000) {
  const c = ac(); if (!c || !master) return
  const t = c.currentTime + at
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length)
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
  f.type = 'highpass'; f.frequency.value = hp
  g.gain.value = vol
  s.buffer = buf; s.connect(f); f.connect(g); g.connect(master)
  s.start(t)
}

const last: Partial<Record<Sfx, number>> = {}

export function sfx(name: Sfx) {
  if (!enabled) return
  // rate-limit rapid repeats (autoplay, plinko pegs)
  const now = performance.now()
  const gap = name === 'tick' ? 35 : name === 'click' ? 40 : 60
  if (last[name] && now - last[name]! < gap) return
  last[name] = now
  switch (name) {
    case 'click': tone(880, 0, 0.05, { type: 'triangle', vol: 0.18 }); break
    case 'tick': tone(1400 + Math.random() * 300, 0, 0.035, { type: 'square', vol: 0.06 }); break
    case 'bet': noise(0, 0.05, 0.18, 3500); tone(520, 0, 0.09, { type: 'triangle', vol: 0.22, slide: 1.4 }); break
    case 'coin': tone(1320, 0, 0.08, { type: 'square', vol: 0.08 }); tone(1980, 0.05, 0.16, { type: 'square', vol: 0.07 }); break
    case 'reveal': tone(990, 0, 0.12, { type: 'sine', vol: 0.3 }); tone(1480, 0.04, 0.16, { type: 'sine', vol: 0.2 }); break
    case 'card': noise(0, 0.07, 0.3, 1800); break
    case 'spin': for (let i = 0; i < 6; i++) tone(300 + i * 40, i * 0.05, 0.05, { type: 'triangle', vol: 0.1 }); break
    case 'lose': tone(220, 0, 0.22, { type: 'triangle', vol: 0.22, slide: 0.6 }); break
    case 'cashout': tone(660, 0, 0.1, { type: 'triangle', vol: 0.3 }); tone(990, 0.07, 0.18, { type: 'triangle', vol: 0.28 }); break
    case 'win': [523, 659, 784].forEach((f, i) => tone(f, i * 0.07, 0.22, { type: 'triangle', vol: 0.3 })); break
    case 'bigwin':
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.4, { type: 'triangle', vol: 0.32 }))
      ;[1047, 1319, 1568].forEach((f) => tone(f, 0.5, 0.9, { type: 'sine', vol: 0.18, attack: 0.03 }))
      for (let i = 0; i < 8; i++) tone(1800 + Math.random() * 1400, 0.45 + i * 0.07, 0.12, { type: 'square', vol: 0.04 })
      break
  }
}
