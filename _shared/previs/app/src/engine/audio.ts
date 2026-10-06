import type { Ctx } from '../data/model'

export type Lane = 'vo' | 'music' | 'sfx'
export interface Mix { solo: Lane | null; mute: Record<Lane, boolean>; db: Record<Lane, number>; duck: boolean; muted: boolean; volume: number }
export interface Peaks { p: number[]; dur: number }

// Web Audio for previs playback: the chosen bed (ducked under the voice), Sarah's lines and the foley,
// scheduled sample-accurately from any start time.
export class AudioEngine {
  ac: AudioContext | null = null
  base = ''
  private bus: Record<string, GainNode> = {}
  private running: AudioBufferSourceNode[] = []
  private cache = new Map<string, Promise<AudioBuffer | null>>()
  private peakCache = new Map<string, Peaks | null>()
  private preview: AudioBufferSourceNode | null = null
  private listeners = new Set<() => void>()
  /** Sound files that could not be fetched or decoded, reported once each. */
  failed = new Set<string>()
  onFail: ((src: string) => void) | null = null

  setBase(b: string) { if (b !== this.base) { this.base = b; this.cache.clear(); this.peakCache.clear() } }

  ensure(): AudioContext | null {
    if (this.ac) return this.ac
    const K = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!K) return null
    const ac = new K()
    this.ac = ac
    const master = ac.createGain(); master.connect(ac.destination)
    this.bus.master = master
    ;(['music', 'sfx', 'vo', 'pv'] as const).forEach(b => { const g = ac.createGain(); g.connect(master); this.bus[b] = g })
    const duck = ac.createGain(); duck.connect(this.bus.music); this.bus.duck = duck
    return ac
  }

  applyMix(m: Mix) {
    if (!this.ac) return
    this.bus.master.gain.value = m.muted ? 0 : m.volume
    ;(['vo', 'music', 'sfx'] as Lane[]).forEach(b => {
      const on = m.solo ? m.solo === b : !m.mute[b]
      this.bus[b].gain.value = on ? Math.pow(10, m.db[b] / 20) * (b === 'music' ? 0.8 : 1) : 0
    })
  }

  buffer(src?: string | null): Promise<AudioBuffer | null> {
    if (!src) return Promise.resolve(null)
    const url = this.base + src
    if (!this.cache.has(url)) {
      const ac = this.ensure()
      this.cache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(url); return r.arrayBuffer() }).then(b => new Promise<AudioBuffer>((ok, no) => ac!.decodeAudioData(b, ok, no))).catch(() => { if (!this.failed.has(src)) { this.failed.add(src); this.onFail?.(src) } return null }))
    }
    return this.cache.get(url)!
  }

  async peaks(src?: string | null): Promise<Peaks | null> {
    if (!src) return null
    if (this.peakCache.has(src)) return this.peakCache.get(src)!
    const b = await this.buffer(src)
    if (!b) { this.peakCache.set(src, null); return null }
    const ch = b.getChannelData(0), n = 900, step = Math.max(1, Math.floor(ch.length / n)), p: number[] = []
    for (let i = 0; i < n; i++) { let m = 0; for (let j = i * step; j < (i + 1) * step; j += 8) m = Math.max(m, Math.abs(ch[j] || 0)); p.push(m) }
    const out = { p, dur: b.duration }
    this.peakCache.set(src, out)
    this.listeners.forEach(f => f())
    return out
  }
  peaksNow(src?: string | null): Peaks | null | undefined { return src ? this.peakCache.get(src) : null }
  onPeaks(f: () => void) { this.listeners.add(f); return () => { this.listeners.delete(f) } }

  /** How many sounds are scheduled right now (used by the smoke test). */
  get scheduled() { return this.running.length }
  get state() { return this.ac?.state || 'none' }

  stop() { this.running.forEach(s => { try { s.stop() } catch { /* already stopped */ } }); this.running = [] }

  /** Schedules everything audible from `from` seconds. Resolves with the audio clock time that maps to `from`. */
  async start(C: Ctx, from: number, mix: Mix, rate: number, only?: { a: number; b: number }): Promise<number | null> {
    const ac = this.ensure(); if (!ac) return null
    if (ac.state === 'suspended') { try { await ac.resume() } catch { /* needs a gesture */ } }
    this.stop(); this.applyMix(mix)
    const m = C.o('music'), jobs: Promise<{ b: AudioBuffer | null; at?: number; bus: string; g?: number; music?: boolean }>[] = []
    if (m?.src) jobs.push(this.buffer(m.src).then(b => ({ b, bus: 'duck', music: true })))
    C.vo().forEach(v => jobs.push(this.buffer(v.o.src).then(b => ({ b, at: v.a, bus: 'vo', g: v.o.gain }))))
    C.sfx().forEach(s => { if (s.o?.src) jobs.push(this.buffer(s.o.src).then(b => ({ b, at: s.a, bus: 'sfx', g: (s.o!.gain ?? 1) * s.g }))) })
    const items = await Promise.all(jobs)
    const now = ac.currentTime + 0.05
    items.forEach(it => {
      if (!it.b) return
      if (only && !it.music && it.at != null && (it.at > only.b || it.at + it.b.duration < only.a)) return
      const s = ac.createBufferSource(); s.buffer = it.b; s.playbackRate.value = rate
      let node: AudioNode = s
      if (it.g != null && it.g !== 1) { const g = ac.createGain(); g.gain.value = it.g; s.connect(g); node = g }
      node.connect(this.bus[it.bus])
      if (it.music) { if (from < it.b.duration) { s.start(now, from); this.running.push(s) } return }
      const rel = ((it.at || 0) - from) / rate
      if (rel >= 0) { s.start(now + rel); this.running.push(s) } else if (-rel * rate < it.b.duration) { s.start(now, -rel * rate); this.running.push(s) }
    })
    const g = this.bus.duck.gain
    g.cancelScheduledValues(now); g.setValueAtTime(1, now)
    if (mix.duck) C.vo().forEach(v => {
      const a = (v.a - from) / rate, b = (v.b - from) / rate
      if (b < 0) return
      g.setValueAtTime(a <= 0 ? 0.4 : 1, now + Math.max(0, a - 0.12)); g.linearRampToValueAtTime(0.4, now + Math.max(0, a))
      g.setValueAtTime(0.4, now + b); g.linearRampToValueAtTime(1, now + b + 0.25)
    })
    return now
  }

  now() { return this.ac ? this.ac.currentTime : performance.now() / 1000 }

  async previewSrc(src?: string | null, gain = 1) {
    this.stopPreview()
    const ac = this.ensure(); if (!ac || !src) return
    if (ac.state === 'suspended') await ac.resume()
    const b = await this.buffer(src); if (!b) return
    const s = ac.createBufferSource(); s.buffer = b
    const g = ac.createGain(); g.gain.value = gain; s.connect(g); g.connect(this.bus.pv)
    s.start(); this.preview = s
  }
  stopPreview() { if (this.preview) { try { this.preview.stop() } catch { /* done */ } this.preview = null } }
}

export const audio = new AudioEngine()
