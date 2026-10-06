import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ui, useStudio, type Draft } from '../../state/store'
import { candidatesAt, crumbs, insideBox, type Cand } from '../../engine/picker'
import { refs } from './refs'
import { playback } from '../../engine/playback'
import { clamp, capture } from '../../lib/util'
import type { Stroke } from '../../data/types'

interface Hover { cands: Cand[]; idx: number; rect: DOMRect; crumbs: string[] }
interface Drag { x0: number; y0: number; x1: number; y1: number; moved: boolean }

/** Comment mode: hover highlights the smallest part under the pointer (scroll for bigger or smaller),
 *  a click comments on it, a drag draws a box around several parts, the pen and arrow draw on the frame. */
export function CommentLayer() {
  const mode = useStudio(s => s.mode)
  const tool = useStudio(s => s.tool)
  const draft = useStudio(s => s.draft)
  const layer = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Hover | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [stroke, setStroke] = useState<Stroke | null>(null)
  // Handlers read the latest values from here: a quick tap can end before React re-renders.
  const live = useRef<{ hover: Hover | null; drag: Drag | null; stroke: Stroke | null }>({ hover: null, drag: null, stroke: null })
  const putHover = (h: Hover | null) => { live.current.hover = h; setHover(h) }
  const putDrag = (d: Drag | null) => { live.current.drag = d; setDrag(d) }
  const putStroke = (t: Stroke | null) => { live.current.stroke = t; setStroke(t) }

  useEffect(() => { if (mode !== 'comment') { putHover(null); putDrag(null); putStroke(null) } }, [mode])
  // Scrolling picks a smaller or bigger part; it must not scroll the page, so the listener is not passive.
  const wheel = useRef<(e: WheelEvent) => void>(() => {})
  useEffect(() => {
    const el = layer.current; if (!el) return
    const h = (e: WheelEvent) => wheel.current(e)
    el.addEventListener('wheel', h, { passive: false }); return () => el.removeEventListener('wheel', h)
  }, [mode])
  if (mode !== 'comment') return null

  const rel = (e: React.PointerEvent | PointerEvent) => { const r = layer.current!.getBoundingClientRect(); return { x: clamp((e.clientX - r.left) / r.width, 0, 1), y: clamp((e.clientY - r.top) / r.height, 0, 1) } }
  const pick = (e: React.PointerEvent) => {
    const v = refs.viewer; if (!v) return
    const cands = candidatesAt(v, e.clientX, e.clientY)
    if (!cands.length) { putHover(null); return }
    const h = live.current.hover, prev = h && h.cands[h.idx]?.el
    const idx = prev ? Math.max(0, cands.findIndex(c => c.el === prev)) : 0
    const c = cands[idx], wrap = v.visibleScene()!
    putHover({ cands, idx, rect: c.el.getBoundingClientRect(), crumbs: crumbs(c.el, wrap) })
  }

  const onMove = (e: React.PointerEvent) => {
    const { stroke: st, drag: g } = live.current
    if (st) { const p = rel(e); putStroke({ ...st, pts: st.tool === 'pen' ? [...st.pts, [p.x, p.y]] : [st.pts[0], [p.x, p.y]] }); return }
    if (g) { const p = rel(e); const moved = g.moved || Math.hypot(p.x - g.x0, p.y - g.y0) > 0.012; putDrag({ ...g, x1: p.x, y1: p.y, moved }); return }
    if (!ui.get().draft) pick(e)
  }
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    capture(layer.current!, e.pointerId)
    playback.pause()
    const p = rel(e)
    if (tool === 'pen' || tool === 'arrow') { putStroke({ tool, pts: [[p.x, p.y]] }); return }
    if (ui.get().draft) return
    if (e.pointerType !== 'mouse') pick(e) // touch has no hover: find the part under the finger now
    putDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y, moved: false })
  }
  const onUp = () => {
    const s = ui.get(), { stroke: st, drag: g, hover: h } = live.current
    if (st) {
      putStroke(null)
      if (st.pts.length < 2) return
      const end = st.pts[st.pts.length - 1]
      const d: Draft = s.draft ? { ...s.draft, strokes: [...s.draft.strokes, st] } : { kind: 'frame', a: s.T, target: 'Drawing on the frame', x: end[0], y: end[1], strokes: [st], quick: [] }
      ui.set({ draft: d }); return
    }
    if (!g) return
    putDrag(null)
    const v = refs.viewer; if (!v) return
    if (g.moved) {
      const box = { x: Math.min(g.x0, g.x1), y: Math.min(g.y0, g.y1), w: Math.abs(g.x1 - g.x0), h: Math.abs(g.y1 - g.y0) }
      const names = insideBox(v, box)
      const target = names.length ? (names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2} more` : names.join(', ')) : 'This area'
      ui.set({ draft: { kind: 'region', a: s.T, target, targets: names, box, x: box.x + box.w, y: box.y, strokes: [], quick: [] } })
    } else {
      const c = h?.cands[h.idx]
      ui.set({ draft: { kind: 'frame', a: s.T, target: c ? c.label : 'This spot', targets: c ? [c.label, ...(h?.crumbs || []).slice(-1)] : [], x: g.x0, y: g.y0, box: c ? boxOf(c.el) : null, strokes: [], quick: [] } })
    }
    putHover(null)
  }
  wheel.current = (e: WheelEvent) => {
    const h = live.current.hover
    if (!h || ui.get().draft) return
    e.preventDefault()
    const idx = clamp(h.idx + (e.deltaY > 0 ? 1 : -1), 0, h.cands.length - 1)
    const c = h.cands[idx], wrap = refs.viewer?.visibleScene()
    putHover({ ...h, idx, rect: c.el.getBoundingClientRect(), crumbs: wrap ? crumbs(c.el, wrap) : [] })
  }

  const fr = refs.frame?.getBoundingClientRect()
  const c = hover?.cands[hover.idx]
  return (
    <div ref={layer} className="absolute inset-0 z-[5]" style={{ cursor: tool === 'point' ? 'crosshair' : 'cell', touchAction: 'none' }}
      onPointerMove={onMove} onPointerDown={onDown} onPointerUp={onUp} onPointerLeave={() => !live.current.drag && !live.current.stroke && putHover(null)} data-testid="comment-layer">
      {hover && c && fr && !drag && !draft && (
        <div className="pointer-events-none absolute rounded-[5px] border-2 border-ember bg-ember/10" style={{ left: hover.rect.left - fr.left, top: hover.rect.top - fr.top, width: hover.rect.width, height: hover.rect.height }} />
      )}
      {hover && c && !drag && !draft && createPortal(<HoverLabel rect={hover.rect} label={c.label} crumbs={hover.crumbs} idx={hover.idx} n={hover.cands.length} />, document.body)}
      {drag && drag.moved && (
        <div className="pointer-events-none absolute rounded-[4px] border-2 border-dashed border-ember bg-ember/15" style={{ left: `${Math.min(drag.x0, drag.x1) * 100}%`, top: `${Math.min(drag.y0, drag.y1) * 100}%`, width: `${Math.abs(drag.x1 - drag.x0) * 100}%`, height: `${Math.abs(drag.y1 - drag.y0) * 100}%` }} />
      )}
      {stroke && <StrokeSvg strokes={[stroke]} />}
    </div>
  )
}

/** The name of the part under the pointer, kept on screen even when the part sits at the frame's edge. */
function HoverLabel({ rect, label, crumbs: path, idx, n }: { rect: DOMRect; label: string; crumbs: string[]; idx: number; n: number }) {
  const el = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: rect.left, top: rect.top - 30 })
  useLayoutEffect(() => {
    const w = el.current?.offsetWidth || 160, h = el.current?.offsetHeight || 26
    const top = rect.top - h - 6 > 4 ? rect.top - h - 6 : rect.bottom + 6
    setPos({ left: clamp(rect.left - 2, 6, innerWidth - w - 6), top: clamp(top, 4, innerHeight - h - 4) })
  }, [rect, label])
  const where = path.length ? path[path.length - 1] : ''
  return (
    <div ref={el} className="pointer-events-none fixed z-[96] flex max-w-[min(360px,90vw)] items-center gap-2 whitespace-nowrap rounded-[7px] bg-ember px-2 py-[3px] text-[12px] font-bold text-ember-ink shadow-lg" style={pos} data-testid="hover-label">
      <span className="truncate">{label}{where && !label.includes(where) ? <span className="font-medium opacity-75"> · {where}</span> : null}</span>
      {n > 1 && <span className="shrink-0 font-medium opacity-75">{idx > 0 ? 'scroll ↑ smaller' : ''}{idx > 0 && idx < n - 1 ? ' · ' : ''}{idx < n - 1 ? 'scroll ↓ bigger' : ''}</span>}
    </div>
  )
}

function boxOf(el: HTMLElement) {
  const fr = refs.frame?.getBoundingClientRect(), r = el.getBoundingClientRect()
  if (!fr) return null
  return { x: (r.left - fr.left) / fr.width, y: (r.top - fr.top) / fr.height, w: r.width / fr.width, h: r.height / fr.height }
}

export function StrokeSvg({ strokes, dim }: { strokes: Stroke[]; dim?: boolean }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{ opacity: dim ? 0.75 : 1 }}>
      <defs><marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="var(--color-ember)" /></marker></defs>
      {strokes.map((s, i) => s.tool === 'arrow'
        ? <line key={i} x1={s.pts[0][0] * 1000} y1={s.pts[0][1] * 1000} x2={s.pts[s.pts.length - 1][0] * 1000} y2={s.pts[s.pts.length - 1][1] * 1000} stroke="var(--color-ember)" strokeWidth={4} vectorEffect="non-scaling-stroke" markerEnd="url(#ah)" strokeLinecap="round" />
        : s.tool === 'box'
          ? <rect key={i} x={Math.min(s.pts[0][0], s.pts[1][0]) * 1000} y={Math.min(s.pts[0][1], s.pts[1][1]) * 1000} width={Math.abs(s.pts[1][0] - s.pts[0][0]) * 1000} height={Math.abs(s.pts[1][1] - s.pts[0][1]) * 1000} fill="none" stroke="var(--color-ember)" strokeWidth={4} vectorEffect="non-scaling-stroke" />
          : <polyline key={i} points={s.pts.map(p => `${p[0] * 1000},${p[1] * 1000}`).join(' ')} fill="none" stroke="var(--color-ember)" strokeWidth={4} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />)}
    </svg>
  )
}
