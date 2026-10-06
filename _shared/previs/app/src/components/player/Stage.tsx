import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FilmViewer } from '../../engine/viewer'
import { playback } from '../../engine/playback'
import { ctxFor, setPick, ui, useStudio } from '../../state/store'
import type { Ctx } from '../../data/model'
import { cleanText, optLabel } from '../../data/model'
import { refs } from './refs'
import { CommentLayer } from './CommentLayer'
import { Pins } from './Pins'
import { Check, Volume2 } from 'lucide-react'
import { Curve } from '../choices/Curve'
import { Tip } from '../ui'

const TRUTH: Record<string, string> = { conceptual_ui: 'Made-up screen', conceptual_visual: 'Concept visual', external_footage: 'Stock footage' }

/** The film frame (or two frames when comparing), fitted to whatever space the player has. */
export function Stage() {
  const D = useStudio(s => s.M?.D)
  const C = useStudio(s => s.C)
  const compare = useStudio(s => s.compare)
  const full = useStudio(s => s.full)
  const screen = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const viewer = useRef<FilmViewer | null>(null)
  const [scale, setScale] = useState(0.25)
  const W = D?.project.w || 1080, H = D?.project.h || 1920

  useEffect(() => {
    if (!D || !host.current) return
    const v = new FilmViewer(host.current, D, () => ui.get().C!)
    viewer.current = v; playback.main = v; refs.viewer = v
    playback.render(ui.get().T)
    return () => { playback.main = null; refs.viewer = null; v.destroy() }
  }, [D])

  useEffect(() => {
    const v = viewer.current; if (!v || !C) return
    v.look()
    playback.extra.forEach(x => x.look())
    playback.restart()
  }, [C])

  useLayoutEffect(() => {
    const el = screen.current; if (!el) return
    const fit = () => {
      // Room above the frame for the truth label, so it never covers the film.
      const r = el.getBoundingClientRect(), n = compare ? compare.ids.length : 1, pad = r.width < 500 ? 10 : 20, top = 30
      const s = Math.min((r.width - pad * 2 - (n - 1) * 16) / n / W, (r.height - pad - top) / H)
      setScale(Math.max(0.05, s))
    }
    fit()
    const ro = new ResizeObserver(fit); ro.observe(el)
    return () => ro.disconnect()
  }, [W, H, compare, full])

  useEffect(() => { refs.frame = frame.current; refs.screen = screen.current })

  const cur = C ? C.at(useStudio.getState().T) : null
  const truth = cur?.sc.truth ? TRUTH[cur.sc.truth] : ''
  return (
    <div ref={screen} className="relative flex h-full w-full items-center justify-center gap-4 overflow-hidden" style={{ paddingTop: 22 }} data-testid="screen">
      <div className="relative shrink-0" style={{ width: W * scale, height: H * scale, display: compare ? 'none' : undefined }}>
        <div ref={frame} className="absolute inset-0 overflow-hidden rounded-[6px] bg-black frame-shadow" data-testid="frame">
          <div ref={host} className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }} />
          <Captions h={H * scale} />
          <Pins />
          <CommentLayer />
        </div>
        <TruthLabel text={truth} />
      </div>
      {compare && D && <CompareFrames W={W} H={H} scale={scale} />}
    </div>
  )
}

/** The narrator's line as a subtitle (in the voice's own language), when captions are on or a line has no recording yet. */
function Captions({ h }: { h: number }) {
  const on = useStudio(s => s.prefs.captions)
  // A string, not an object: store selectors must return stable values.
  const raw = useStudio(s => { if (!s.C) return ''; const v = s.C.vo().find(x => s.T >= x.a - 0.05 && s.T <= x.b + 0.25); return v ? `${v.missing ? '1' : '0'}${cleanText(v.o.text)}` : '' })
  const line = raw ? { missing: raw[0] === '1', text: raw.slice(1) } : null
  if (!line || (!on && !line.missing)) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 z-[3] flex justify-center px-[6%]" style={{ bottom: '7%' }} data-testid="caption">
      <span className="rounded-[6px] bg-black/75 px-2.5 py-1 text-center font-semibold leading-snug text-white" style={{ fontSize: Math.max(11, h * 0.026) }}>
        {line.text}{line.missing && <span className="ml-1.5 text-amber" style={{ fontSize: '0.8em' }}>(not recorded yet)</span>}
      </span>
    </div>
  )
}

function TruthLabel({ text }: { text: string }) {
  const T = useStudio(s => s.T), C = useStudio(s => s.C)
  const t = C ? (TRUTH[C.at(T).sc.truth || ''] || '') : text
  if (!t) return null
  return (
    <Tip title={t} desc="Not a real screen or real footage: drawn for this plan. The final film says so where it matters." side="right">
      <span className="absolute bottom-full left-0 mb-1.5 flex items-center gap-1.5 text-[11.5px] font-semibold text-muted"><span className="h-1.5 w-1.5 rounded-full bg-amber" />{t}</span>
    </Tip>
  )
}

/** Two to four versions of the film side by side, painted by one clock. Click a frame to hear that version. */
function CompareFrames({ W, H, scale }: { W: number; H: number; scale: number }) {
  const compare = useStudio(s => s.compare!)
  const picks = useStudio(s => s.picks)
  const M = useStudio(s => s.M!)
  const ctxs = useRef(new Map<string, Ctx | null>())
  // Each version is the current film with only this decision changed.
  ctxs.current = new Map(compare.ids.map(id => [id, ctxFor({ ...picks, [compare.key]: id })]))
  useEffect(() => {
    playback.audioCtx = () => ctxs.current.get(ui.get().compare?.ids[ui.get().compare?.hear ?? 0] ?? '') || null
    return () => { playback.audioCtx = null }
  }, [])
  useEffect(() => { playback.extra.forEach(v => v.look()); playback.restart() }, [picks, M, compare.ids.join(','), compare.hear])
  const hear = (i: number) => { ui.set({ compare: { ...compare, hear: i } }) }
  const d = M.DEC[compare.key]
  return (
    <>
      {compare.ids.map((id, i) => {
        const o = d?.options.find(x => x.id === id)
        return (
          <div key={id} className="relative shrink-0" style={{ width: W * scale, height: H * scale }}>
            <CompareTile id={id} ctxs={ctxs} scale={scale} on={compare.hear === i} onHear={() => hear(i)} />
            <div className="pointer-events-none absolute inset-x-0 bottom-full mb-1.5 flex items-center justify-center gap-1.5">
              <button type="button" className={`pointer-events-auto flex max-w-full items-center gap-1.5 truncate rounded-full px-3 py-1 text-[12px] font-bold ${compare.hear === i ? 'bg-sky text-sky-ink' : 'bg-raise text-fg'}`} onClick={() => hear(i)} title="Hear this version">
                {compare.hear === i && <Volume2 size={13} />}<span className="truncate">{id} · {optLabel(o)}</span>
              </button>
              {d?.kind === 'motion' && o && <span className="pointer-events-auto rounded-full bg-raise px-1 text-sky"><Curve o={o} w={36} h={20} /></span>}
            </div>
            <button type="button" className="absolute bottom-2 left-1/2 z-[4] -translate-x-1/2 whitespace-nowrap rounded-full bg-black/75 px-3 py-1 text-[12px] font-bold text-white hover:bg-black" onClick={e => { e.stopPropagation(); setPick(compare.key, id); ui.set({ compare: null }); playback.pause() }} data-testid={`use-${id}`}>
              <Check size={12} className="mr-1 inline" />Use {id}
            </button>
          </div>
        )
      })}
    </>
  )
}

function CompareTile({ id, ctxs, scale, on, onHear }: { id: string; ctxs: React.RefObject<Map<string, Ctx | null>>; scale: number; on: boolean; onHear: () => void }) {
  const D = useStudio(s => s.M!.D)
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!host.current) return
    const v = new FilmViewer(host.current, D, () => ctxs.current!.get(id) || ui.get().C!)
    playback.extra.add(v); playback.render(ui.get().T)
    return () => { playback.extra.delete(v); v.destroy() }
  }, [D, id])
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[6px] bg-black frame-shadow" style={{ outline: on ? '2px solid var(--color-sky)' : 'none', outlineOffset: 3 }} onClick={onHear} data-testid="compare-tile">
      <div ref={host} className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }} />
    </div>
  )
}
