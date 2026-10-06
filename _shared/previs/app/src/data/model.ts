import type { Option, Previs, Picks, Scene, Sfx, Tweaks } from './types'

export type Kind = 'direction' | 'music' | 'motion' | 'pacing' | 'transition' | 'camera' | 'vo' | 'sfx' | string

export interface Dec {
  key: string
  q: string
  help: string
  kind: Kind
  scene: string | null
  owner?: string
  options: Option[]
  chosen: string
  sfx?: Sfx
  /** Only one option: the director (or the reviewer) has fixed it. It still plays, but no choice card is shown. */
  locked?: boolean
}

export interface Model { D: Previs; DEC: Record<string, Dec>; ORDER: string[]; DIRECTOR: Picks }

const HELP: Record<string, string> = {
  direction: 'The overall look: colours, type and surfaces. It changes every shot at once.',
  music: 'The background track. The dots in the Music lane are its beats.',
  motion: 'How things move: springy with a little bounce, smooth, or snappy.',
  pacing: 'How long every shot lasts. Faster makes the film shorter.',
  transition: 'How this shot starts: a hard cut, a slide, a push or a zoom.',
  camera: 'What the camera does while this shot plays.',
  vo: 'The line the narrator speaks over this shot.',
  sfx: 'A sound effect at this moment, or none.',
  voice: 'Who narrates the film, and in which language. Every line switches at once.',
}

/** Which option library feeds a decision, if any. */
export function libraryKind(d: { kind: string }): string | null {
  return ['direction', 'music', 'motion', 'pacing', 'voice', 'camera', 'transition', 'sfx'].includes(d.kind) ? d.kind : null
}
export type Custom = Record<string, Option[]>

export function buildModel(D: Previs, custom: Custom = {}): Model {
  const DEC: Record<string, Dec> = {}, ORDER: string[] = []
  // Options added by the reviewer or the AI director sit after the director's three.
  // A decision with a single option is locked (for example the script and voice the owner asked the director to fix): it resolves
  // like any other but stays out of ORDER, so no choice card, guide step or "changed" count ever shows it.
  const add = (d: Dec) => {
    const extra = (custom[d.key] || []).filter(o => !d.options.some(x => x.id === o.id)); if (extra.length) d = { ...d, options: [...d.options, ...extra] }
    if (d.options.length < 2) { DEC[d.key] = { ...d, locked: true }; return }
    DEC[d.key] = d; ORDER.push(d.key)
  }
  add({ key: 'direction', q: 'Which look?', help: HELP.direction, kind: 'direction', scene: null, owner: 'art', options: D.directions.options, chosen: D.directions.chosen })
  const G: Record<string, [string, string]> = { music: ['Which music?', 'music'], motion: ['How should things move?', 'motion'], pacing: ['How fast is the film?', 'editorial'], voice: ['Which voice?', 'script'] }
  Object.entries(D.global).forEach(([k, v]) => add({ key: k, q: G[k]?.[0] || v.label || k, help: HELP[k] || '', kind: k, scene: null, owner: G[k]?.[1], options: v.options, chosen: v.chosen }))
  D.scenes.forEach((sc, i) => {
    const n = i + 1
    const Q: Record<string, [string, string]> = { transition: [`How does shot ${n} begin?`, 'transitions'], camera: ['How does the camera move?', 'camera'], vo: ['What does Sarah say?', 'script'] }
    Object.entries(sc.decisions || {}).forEach(([k, v]) => add({ key: `${sc.id}.${k}`, q: Q[k]?.[0] || v.label || k, help: HELP[k] || '', kind: k, scene: sc.id, owner: Q[k]?.[1], options: v.options, chosen: v.chosen }))
    ;(sc.sfx || []).forEach(x => add({ key: `${sc.id}.${x.id}`, q: x.label.replace(/\s*\(.*\)$/, ''), help: (x.why ? x.why + ' ' : '') + HELP.sfx, kind: 'sfx', scene: sc.id, owner: 'sfx', options: x.options, chosen: x.chosen, sfx: x }))
  })
  const DIRECTOR: Picks = {}
  ORDER.forEach(k => { DIRECTOR[k] = DEC[k].chosen })
  return { D, DEC, ORDER, DIRECTOR }
}

export interface Shot { sc: Scene; i: number; start: number; end: number; k: number }
export interface VoEv { r: Shot; o: Option; a: number; b: number; voice: Option | null; missing: boolean }
export interface SfxEv { r: Shot; x: Sfx; key: string; o: Option | null; a: number; g: number; j: number }

export interface Ctx {
  picks: Picks
  o: (k: string) => Option | null
  TL: Shot[]
  total: number
  at: (t: number) => Shot
  of: (id: string) => Shot
  vo: () => VoEv[]
  sfx: () => SfxEv[]
  beats: () => number[]
}

export const optIn = (M: Model, picks: Picks, k: string): Option | null => {
  const d = M.DEC[k]
  if (!d) return null
  return d.options.find(o => o.id === picks[k]) || d.options.find(o => o.id === d.chosen) || d.options[0]
}

export function makeCtx(M: Model, picks: Picks, tweaks: Tweaks): Ctx {
  const o = (k: string) => optIn(M, picks, k)
  const k = o('pacing')?.scale || 1
  let t = 0
  const TL: Shot[] = M.D.scenes.map((sc, i) => { const r = { sc, i, start: t, end: t + sc.dur * k, k }; t = r.end; return r })
  const total = t
  let voCache: VoEv[] | null = null, sfxCache: SfxEv[] | null = null, beatCache: number[] | null = null
  return {
    picks, o, TL, total,
    at: tt => TL.find(r => tt < r.end) || TL[TL.length - 1],
    of: id => TL.find(r => r.sc.id === id) || TL[0],
    vo: () => voCache || (voCache = TL.map(r => {
      const w = o(`${r.sc.id}.vo`); if (!w) return null
      const voice = o('voice'), k = `${r.sc.id}-${w.id}`
      // A wording the director wrote has a take for every library voice; a new wording waits for Claude Code.
      const fresh = !!w.needs || w.origin === 'ai' || w.origin === 'you'
      let src = fresh ? null : w.src ?? null, dur = w.dur, text = w.text
      if (voice?.dir) { src = fresh ? null : `${voice.dir}${k}.mp3`; dur = voice.durs?.[k] ?? w.dur; text = voice.texts?.[k] ?? w.text }
      // A voice this copy has no takes for (e.g. a shared demo): silent, shown as captions, until Claude Code records it.
      else if (voice?.needs) { src = null; dur = voice.durs?.[k] ?? w.dur; text = voice.texts?.[k] ?? w.text }
      const a = r.start + (w.at || 0) * r.k
      return { r, o: { ...w, src, dur, text }, a, b: a + (dur || 1.5), voice, missing: !src }
    }).filter(Boolean) as VoEv[]),
    sfx: () => {
      if (sfxCache) return sfxCache
      const out: SfxEv[] = []
      TL.forEach(r => (r.sc.sfx || []).forEach(x => {
        const key = `${r.sc.id}.${x.id}`, v = o(key), w = tweaks[key] || {}
        const ats = Array.isArray(x.at) ? x.at : [x.at]
        ats.forEach((at, j) => out.push({ r, x, key, o: v, a: r.start + at * r.k + (w.dt || 0), g: Math.pow(x.step || 0.88, j) * Math.pow(10, (w.db || 0) / 20), j }))
      }))
      return (sfxCache = out)
    },
    beats: () => {
      if (beatCache) return beatCache
      const m = o('music'); if (!m || !m.bpm) return (beatCache = [])
      const per = 60 / m.bpm, out: number[] = []
      for (let x = m.phase || 0; x <= total + 0.01; x += per) out.push(x)
      return (beatCache = out)
    },
  }
}

/** The moment that best shows a choice: where to start and stop playback when trying an option. */
export function momentOf(M: Model, C: Ctx, key: string, current: Shot): [number, number] {
  const d = M.DEC[key]
  if (key === 'pacing') return [0, Math.min(C.total, 7)]
  if (key === 'music') return [0, Math.min(C.total, 8)]
  if (key === 'voice') { const v = C.vo(); return v.length ? [Math.max(0, v[0].a - 0.4), Math.min(C.total, (v[1] || v[0]).b + 0.3)] : [0, 6] }
  if (!d || !d.scene) return [current.start, current.end]
  const r = C.of(d.scene)
  if (d.kind === 'transition') return [Math.max(0, r.start - 1.5), Math.min(C.total, r.start + 2)]
  if (d.kind === 'vo') { const o = C.o(key); const a = r.start + ((o?.at) || 0) * r.k; return [Math.max(0, a - 0.6), Math.min(C.total, a + (o?.dur || 2) + 0.5)] }
  if (d.kind === 'sfx') { const ev = C.sfx().filter(s => s.key === key); if (!ev.length) return [r.start, r.end]; return [Math.max(0, ev[0].a - 1.2), Math.min(C.total, ev[ev.length - 1].a + 1)] }
  return [r.start, r.end]
}

/** Milliseconds between a sound and its nearest beat (positive = after the beat). */
export function beatOffsetMs(C: Ctx, key: string): number | null {
  const ev = C.sfx().find(s => s.key === key); const bt = C.beats()
  if (!ev || !bt.length) return null
  let best = bt[0]
  bt.forEach(b => { if (Math.abs(b - ev.a) < Math.abs(best - ev.a)) best = b })
  return Math.round((ev.a - best) * 1000)
}

export interface Check { level: 'ok' | 'warn' | 'bad'; text: string; t?: number }
export function qaChecks(M: Model, C: Ctx): Check[] {
  const out: Check[] = [], vs = C.vo()
  const clean = (s?: string) => String(s || '').replace(/\[[^\]]*\]\s*/g, '')
  out.push({ level: 'ok', text: `Runtime ${C.total.toFixed(1)} s at this speed.` })
  vs.forEach(v => {
    const words = clean(v.o.text).trim().split(/\s+/).length, rate = words / Math.max(0.3, v.o.dur || 1)
    if (v.o.text && /[\u0900-\u097F]/.test(v.o.text)) return
    if (rate > 3.4) out.push({ level: 'warn', text: `Shot ${v.r.i + 1}: Sarah speaks ${rate.toFixed(1)} words a second, fast for a phone ad.`, t: v.a })
    if (v.b > v.r.end + 0.05) out.push({ level: 'warn', text: `Shot ${v.r.i + 1}: the line runs ${(v.b - v.r.end).toFixed(2)} s into the next shot.`, t: v.a })
  })
  for (let i = 1; i < vs.length; i++) if (vs[i].a < vs[i - 1].b + 0.1) out.push({ level: 'bad', text: `Voice lines ${i} and ${i + 1} overlap.`, t: vs[i].a })
  const bt = C.beats()
  C.sfx().filter(s => s.x.hit && s.j === 0).forEach(s => {
    if (!bt.length) return
    const ms = beatOffsetMs(C, s.key) ?? 0
    out.push({ level: Math.abs(ms) <= 40 ? 'ok' : 'warn', text: `${s.x.label}: ${Math.abs(ms) <= 15 ? 'on the beat' : `${Math.abs(ms)} ms ${ms > 0 ? 'after' : 'before'} the beat`}.`, t: s.a })
  })
  const nS = C.sfx().filter(s => s.o && s.o.src).length
  out.push({ level: bt.length && nS > bt.length ? 'warn' : 'ok', text: `${nS} sounds against ${bt.length} beats (fewer sounds than beats keeps it premium).` })
  M.D.scenes.forEach((sc, i) => { if ((sc.levels || 1) > 2) out.push({ level: 'bad', text: `Shot ${i + 1} shows more than two text levels.` }) })
  const missing = vs.filter(v => v.missing)
  if (missing.length) out.push({ level: 'warn', text: `${missing.length} voice line${missing.length > 1 ? 's' : ''} still need a recorded take from Claude Code (silent here, shown as captions).`, t: missing[0].a })
  const voice = C.o('voice')
  if (voice?.lang && voice.lang !== 'en') out.push({ level: 'ok', text: `Narration in ${voice.accent || voice.lang} (${voice.name}); on-screen text stays English.` })
  const concept = M.D.scenes.filter(s => s.truth && s.truth !== 'real_ui').length
  if (concept) out.push({ level: 'warn', text: `${concept} of ${M.D.scenes.length} shots are made-up screens or concept visuals (labelled in the player).` })
  ;(M.D.qa || []).forEach(q => out.push({ level: q.level === 'ok' ? 'ok' : q.level === 'bad' ? 'bad' : 'warn', text: q.text }))
  return out
}

export const cleanText = (s?: string | null) => String(s || '').replace(/\[[^\]]*\]\s*/g, '')
export const optLabel = (o?: Option | null) => cleanText(o?.name || o?.text || o?.id || '')
