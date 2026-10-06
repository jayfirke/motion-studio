import type { Anim, Previs, Scene } from '../data/types'
import type { Ctx, Shot } from '../data/model'
import { cleanText } from '../data/model'

// Paints a film frame for any time t. Every frame is a pure function of t and the current picks.

export const EASES: Record<string, (x: number) => number> = {
  lin: x => x,
  out: x => 1 - Math.pow(1 - x, 3),
  in: x => x * x * x,
  inout: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  power3: x => 1 - Math.pow(1 - x, 3),
  snappy: x => 1 - Math.pow(1 - x, 5),
  spring: x => (x >= 1 ? 1 : 1 - Math.exp(-7 * x) * Math.cos(6 * x)),
  sine: x => Math.sin((x * Math.PI) / 2),
  power2: x => 1 - (1 - x) * (1 - x),
  expo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
}

/** A cubic-bezier easing (CSS semantics), solved by Newton steps on x. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t, sy = (t: number) => ((ay * t + by) * t + cy) * t, dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 6; i++) { const e = sx(t) - x, d = dx(t); if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break; t -= e / d }
    return sy(Math.min(1, Math.max(0, t)))
  }
}

/** The easing curve a Motion option describes: a named ease, a damped spring {f, d}, or a bezier. */
export function easeFor(o?: { ease?: string; spring?: { f: number; d: number }; bezier?: [number, number, number, number] } | null): (x: number) => number {
  if (!o) return EASES.power3
  if (o.spring) { const { f, d } = o.spring; return x => (x >= 1 ? 1 : 1 - Math.exp(-d * x) * Math.cos(f * x)) }
  if (o.bezier) return bezier(...o.bezier)
  return EASES[o.ease || 'power3'] || EASES.power3
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, p: number) => a + (b - a) * p
const DEF: Record<string, number> = { x: 0, y: 0, s: 1, sx: 1, sy: 1, r: 0, o: 1, clip: 1, blur: 0 }

interface Seg { t0: number; t1: number; f: number; to: number; ease?: string }
interface SceneRt {
  sc: Scene
  wrap: HTMLDivElement
  cam: HTMLDivElement
  props: Map<HTMLElement, Record<string, Seg[]>>
  sets: { e: HTMLElement; at: number; cls: string; until?: number }[]
  counts: { e: HTMLElement; t: [number, number]; n: [number, number]; d: number; p: string; ease?: string }[]
  copyEls: HTMLElement[]
  videos: HTMLVideoElement[]
}

/** Real screen recordings inside a scene follow the film clock: they play while the film plays (at the film's pace)
 *  and hold the exact frame while scrubbing or showing a still. `data-at` delays a clip inside its scene. Always muted:
 *  sound comes from the film's own lanes. */
function syncVideos(S: SceneRt, uu: number, k: number) {
  const now = performance.now()
  for (const v of S.videos) {
    const vt = Math.max(0, uu - (parseFloat(v.dataset.at || '0') || 0))
    const st = (v as unknown as { __sync?: { uu: number; now: number } }).__sync ||= { uu: -1, now: 0 }
    const dt = (now - st.now) / 1000, du = uu - st.uu
    const running = st.uu >= 0 && dt > 0 && dt < 0.25 && du > 0 && Math.abs(du - dt / k) < 0.08
    st.uu = uu; st.now = now
    const rate = 1 / k
    if (Math.abs(v.playbackRate - rate) > 0.001) v.playbackRate = rate
    if (running) {
      if (v.paused) v.play().catch(() => {})
      if (Math.abs(v.currentTime - vt) > 0.25) v.currentTime = vt
    } else {
      if (!v.paused) v.pause()
      if (Math.abs(v.currentTime - vt) > 0.04) v.currentTime = vt
    }
  }
}
const pauseVideos = (S: SceneRt) => S.videos.forEach(v => { if (!v.paused) v.pause(); (v as unknown as { __sync?: unknown }).__sync = undefined })
/** Before a cut, park the next scene's clips on their first frame, so the decoder has it ready and the cut doesn't stall. */
const primeVideos = (S: SceneRt) => S.videos.forEach(v => {
  const vt = Math.max(0, -(parseFloat(v.dataset.at || '0') || 0))
  if (!v.paused) v.pause()
  if (!v.seeking && Math.abs(v.currentTime - vt) > 0.04) v.currentTime = vt
})

/** Injects a film's own CSS once per film, scoped to that film's viewers (main, compare, cards, posters). */
export function useFilmCss(D: Previs) {
  const id = D.project.id
  if (document.querySelector(`style[data-film-css="${CSS.escape(id)}"]`)) return
  const st = document.createElement('style')
  st.dataset.filmCss = id
  st.textContent = (D.film_css || '').replace(/#stage/g, `.fstage[data-film="${id}"]`)
  document.head.appendChild(st)
  if (D.fonts_url && !document.querySelector(`link[data-film-fonts="${CSS.escape(id)}"]`)) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = D.fonts_url; l.dataset.filmFonts = id; document.head.appendChild(l)
  }
}

const loadedFonts = new Set<string>()
/** Loads a look's own web fonts once (library and AI looks bring their own families). */
export function loadFonts(url: string) {
  if (loadedFonts.has(url) || !/^https:\/\/fonts\.googleapis\.com\//.test(url)) return
  loadedFonts.add(url)
  const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = url; document.head.appendChild(l)
}

function buildScene(sc: Scene, host: HTMLElement): SceneRt {
  const wrap = document.createElement('div')
  wrap.className = 'fscene'
  wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:var(--bg);visibility:hidden'
  wrap.dataset.scene = sc.id
  const cam = document.createElement('div')
  cam.className = 'fcam'
  cam.style.cssText = 'position:absolute;inset:0;transform-origin:50% 50%'
  cam.innerHTML = sc.html
  wrap.appendChild(cam); host.appendChild(wrap)
  const props = new Map<HTMLElement, Record<string, Seg[]>>(), sets: SceneRt['sets'] = [], counts: SceneRt['counts'] = []
  ;(sc.anim || []).forEach((a: Anim) => {
    let ts: HTMLElement[] = []
    try { ts = Array.from(cam.querySelectorAll<HTMLElement>(a.s)) } catch { ts = [] }
    if (a.set) { ts.forEach(e => sets.push({ e, at: a.at || 0, cls: a.set!, until: a.until })); return }
    if (a.count) { ts.forEach(e => counts.push({ e, t: a.t || [0, 1], n: a.count!, d: a.d == null ? 2 : a.d, p: a.p || '', ease: a.e })); return }
    const keys = new Set([...Object.keys(a.f || {}), ...Object.keys(a.to || {})])
    ts.forEach(e => {
      if (!props.has(e)) props.set(e, {})
      const pm = props.get(e)!
      keys.forEach(k => { (pm[k] = pm[k] || []).push({ t0: a.t?.[0] || 0, t1: a.t?.[1] || 0, f: (a.f || {})[k] as number, to: (a.to || {})[k] as number, ease: a.e }) })
    })
  })
  props.forEach(pm => Object.keys(pm).forEach(k => {
    let prev: number | undefined
    pm[k].sort((x, y) => x.t0 - y.t0).forEach(s => {
      if (s.f == null) s.f = prev != null ? prev : DEF[k] ?? 0
      if (s.to == null) s.to = s.f
      prev = s.to
    })
  }))
  const videos = Array.from(cam.querySelectorAll<HTMLVideoElement>('video'))
  videos.forEach(v => { v.muted = true; v.playsInline = true; v.preload = 'auto'; v.loop = false; v.removeAttribute('autoplay') })
  return { sc, wrap, cam, props, sets, counts, copyEls: Array.from(cam.querySelectorAll<HTMLElement>('[data-copy]')), videos }
}

function paintScene(S: SceneRt, uu: number, ctx: Ctx) {
  const mEase = easeFor(ctx.o('motion'))
  const easeOf = (e?: string) => (!e || e === 'm' ? mEase : EASES[e] || EASES.power3)
  const valAt = (segs: Seg[]) => {
    if (uu <= segs[0].t0) return segs[0].f
    let s = segs[0]
    for (const g of segs) { if (g.t0 <= uu) s = g; else break }
    if (uu >= s.t1) return s.to
    return lerp(s.f, s.to, easeOf(s.ease)((uu - s.t0) / Math.max(1e-6, s.t1 - s.t0)))
  }
  S.props.forEach((pm, e) => {
    const v: Record<string, number> = {}
    for (const k in pm) v[k] = valAt(pm[k])
    const s = v.s ?? 1
    e.style.transform = `translate(${(v.x || 0).toFixed(2)}px,${(v.y || 0).toFixed(2)}px) rotate(${(v.r || 0).toFixed(3)}deg) scale(${(s * (v.sx ?? 1)).toFixed(4)},${(s * (v.sy ?? 1)).toFixed(4)})`
    if (v.o != null) e.style.opacity = clamp(v.o, 0, 1).toFixed(3)
    if (v.clip != null) e.style.clipPath = `inset(${((1 - clamp(v.clip, 0, 1)) * 100).toFixed(2)}% 0 0 0)`
    if (v.blur != null) e.style.filter = v.blur > 0.05 ? `blur(${v.blur.toFixed(2)}px)` : ''
  })
  S.sets.forEach(z => z.e.classList.toggle(z.cls, uu >= z.at && (z.until == null || uu < z.until)))
  S.counts.forEach(c => {
    const p = clamp((uu - c.t[0]) / Math.max(1e-6, c.t[1] - c.t[0]), 0, 1)
    c.e.textContent = c.p + lerp(c.n[0], c.n[1], easeOf(c.ease || 'out')(p)).toFixed(c.d)
  })
}

function camTf(ctx: Ctx, sc: Scene, u: number, dur: number) {
  const c = ctx.o(`${sc.id}.camera`)?.cam || {}
  const p = EASES.inout(clamp(u / Math.max(1e-6, dur), 0, 1))
  return {
    origin: c.origin || '50% 50%',
    tf: `translate(${(c.x ? lerp(c.x[0], c.x[1], p) : 0).toFixed(2)}px,${(c.y ? lerp(c.y[0], c.y[1], p) : 0).toFixed(2)}px) scale(${(c.s ? lerp(c.s[0], c.s[1], p) : 1).toFixed(4)})`,
  }
}

export class FilmViewer {
  host: HTMLElement
  scenes: SceneRt[]
  getCtx: () => Ctx
  W: number
  H: number

  constructor(host: HTMLElement, D: Previs, getCtx: () => Ctx) {
    useFilmCss(D)
    this.host = host
    this.getCtx = getCtx
    this.W = D.project.w; this.H = D.project.h
    host.innerHTML = ''
    host.classList.add('fstage')
    host.dataset.film = D.project.id
    host.style.width = this.W + 'px'; host.style.height = this.H + 'px'
    this.scenes = D.scenes.map(sc => buildScene(sc, host))
    this.look()
  }

  look() {
    const ctx = this.getCtx(), dir = ctx.o('direction'), t = dir?.tokens || {}
    if (dir?.fonts_url) loadFonts(dir.fonts_url)
    for (const k in t) this.host.style.setProperty('--' + k, t[k])
    this.scenes.forEach(S => {
      const v = ctx.o(`${S.sc.id}.vo`)
      S.copyEls.forEach(c => { const x = v && (v.copy || v.text); if (x) c.textContent = cleanText(x) })
    })
  }

  paint(t: number): Shot {
    const ctx = this.getCtx(), TL = ctx.TL
    t = clamp(t, 0, ctx.total)
    const cur = ctx.at(t)
    this.scenes.forEach(S => { const w = S.wrap.style; w.visibility = 'hidden'; w.zIndex = '1'; w.transform = ''; w.clipPath = ''; w.filter = '' })
    const shown = new Set<number>()
    const show = (i: number, z: number) => {
      const r = TL[i], S = this.scenes[i]
      S.wrap.style.visibility = 'visible'; S.wrap.style.zIndex = String(z)
      const u = t - r.start
      paintScene(S, u / r.k, ctx)
      if (S.videos.length) { shown.add(i); syncVideos(S, u / r.k, r.k) }
      const c = camTf(ctx, r.sc, u, r.end - r.start)
      S.cam.style.transformOrigin = c.origin; S.cam.style.transform = c.tf
    }
    show(cur.i, 2)
    const tr = (r: Shot) => { const o = ctx.o(`${r.sc.id}.transition`); return { type: o?.type || 'cut', d: (o?.d || 0.5) * r.k, at: (o as { at?: unknown })?.at as [number, number] | undefined } }
    const blend = (a: Shot, b: Shot, p: number, type: string, at?: [number, number]) => {
      const A = this.scenes[a.i].wrap.style, B = this.scenes[b.i].wrap.style, e = EASES.inout(clamp(p, 0, 1))
      if (type === 'push') { A.transform = `translateY(${-30 * e}%)`; A.filter = `brightness(${1 - 0.45 * e})`; B.transform = `translateY(${100 * (1 - e)}%)` }
      else if (type === 'slide') { A.transform = `translateX(${-30 * e}%)`; A.filter = `brightness(${1 - 0.45 * e})`; B.transform = `translateX(${100 * (1 - e)}%)` }
      else if (type === 'zoom') { A.transform = `scale(${1 + 0.35 * e})`; B.transform = `scale(${1.12 - 0.12 * e})`; B.clipPath = `inset(${(46 * (1 - e)).toFixed(2)}% ${(40 * (1 - e)).toFixed(2)}% round ${(80 * (1 - e)).toFixed(1)}px)` }
      else if (type === 'iris') { const xy = Array.isArray(at) ? at : [50, 50]; B.clipPath = `circle(${(150 * e).toFixed(2)}% at ${xy[0]}% ${xy[1]}%)` }
    }
    const nx = TL[cur.i + 1], pv = TL[cur.i - 1]
    if (nx) { const q = tr(nx); if (q.type !== 'cut' && t >= nx.start - q.d / 2) { show(nx.i, 3); blend(cur, nx, (t - (nx.start - q.d / 2)) / q.d, q.type, q.at) } }
    if (pv) { const q = tr(cur); if (q.type !== 'cut' && t < cur.start + q.d / 2) { show(pv.i, 1); this.scenes[cur.i].wrap.style.zIndex = '3'; blend(pv, cur, (t - (cur.start - q.d / 2)) / q.d, q.type, q.at) } }
    // warm the next scene's clips about a second and a half before its cut
    const ahead = TL[cur.i + 1]
    if (ahead && this.scenes[ahead.i].videos.length && !shown.has(ahead.i) && ahead.start - t < 1.5) { primeVideos(this.scenes[ahead.i]); shown.add(ahead.i) }
    this.scenes.forEach((S, i) => { if (S.videos.length && !shown.has(i)) pauseVideos(S) })
    return cur
  }

  /** One shot at a local time (seconds at pace 1), for storyboard stills and in-place shot playback. */
  still(sceneId: string, u: number) {
    const ctx = this.getCtx(), r = ctx.of(sceneId)
    this.scenes.forEach(S => { S.wrap.style.visibility = 'hidden'; S.wrap.style.transform = ''; S.wrap.style.clipPath = ''; S.wrap.style.filter = '' })
    const S = this.scenes.find(x => x.sc.id === sceneId)
    if (!S) return
    S.wrap.style.visibility = 'visible'
    paintScene(S, u, ctx)
    if (S.videos.length) syncVideos(S, u, r.k)
    const c = camTf(ctx, S.sc, u * r.k, r.end - r.start)
    S.cam.style.transformOrigin = c.origin; S.cam.style.transform = c.tf
  }

  /** The visible scene wrapper that contains an element (used by the comment picker). */
  visibleScene(): HTMLElement | null {
    const s = this.scenes.find(S => S.wrap.style.visibility === 'visible' && S.wrap.style.zIndex === '2') || this.scenes.find(S => S.wrap.style.visibility === 'visible')
    return s ? s.wrap : null
  }

  destroy() { this.scenes.forEach(pauseVideos); this.host.innerHTML = '' }
}
