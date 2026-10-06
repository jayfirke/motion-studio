import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownToLine, ChevronDown, ChevronUp, MessageSquarePlus, Minus, Plus } from 'lucide-react'
import { laneVolume, setMix, setTweak, ui, useStudio } from '../../state/store'
import { playback } from '../../engine/playback'
import { audio, type Lane, type Peaks } from '../../engine/audio'
import { FilmViewer } from '../../engine/viewer'
import { beatOffsetMs, cleanText, optLabel, type Ctx } from '../../data/model'
import { ChoiceCard } from '../choices/ChoiceCard'
import { IconBtn, Tip } from '../ui'
import { useOutside, usePhone, useWidth } from '../../lib/hooks'
import { clamp, cx, store as ls, tc, capture } from '../../lib/util'

const ROW = { film: 44, lane: 40 }
const LANES: { id: Lane; name: string; short: string; desc: string }[] = [
  { id: 'vo', name: 'Voice', short: 'Voice', desc: "Sarah's lines. Click one to change or comment on it." },
  { id: 'music', name: 'Music', short: 'Music', desc: 'The background track. Dots are its beats; the line shows the music dipping under the voice.' },
  { id: 'sfx', name: 'Sounds', short: 'SFX', desc: 'Sound effects. Drag one to move it (it snaps to the beat); click to swap or comment.' },
]

type Pop = { key: string; x: number; y: number }
const DOT: Record<Lane, string> = { vo: 'bg-sky', music: 'bg-amber', sfx: 'bg-mint' }

/** The film's timeline: shots with notes on top, then the three sound lanes, one shared playhead. */
export function Timeline({ compact }: { compact?: boolean }) {
  const C = useStudio(s => s.C)
  const phone = usePhone()
  const [open, setOpen] = useState(() => ls.get<boolean>('studio2:lanes') ?? !matchMedia('(max-width: 639px)').matches)
  const [pop, setPop] = useState<Pop | null>(null)
  const track = useRef<HTMLDivElement>(null)
  if (!C) return null
  const gut = compact ? 0 : phone ? 76 : 200
  const toggleLanes = () => { setOpen(!open); ls.set('studio2:lanes', !open) }
  return (
    <div className={cx('relative select-none', !compact && 'border-t border-line bg-panel')} data-testid="timeline" data-tour="timeline">
      <div className="grid" style={{ gridTemplateColumns: compact ? 'minmax(0, 1fr)' : `${gut}px minmax(0, 1fr)` }}>
        {!compact && (
          <div className="flex items-center gap-1 border-r border-line px-2" style={{ height: ROW.film }}>
            {!phone && <span className="label truncate">Shots</span>}
            <span className="flex-1" />
            <IconBtn small label={open ? 'Hide sound lanes' : 'Show sound lanes'} desc="Voice, music and sound effects on the same timeline" onClick={toggleLanes}>{open ? <ChevronDown size={15} /> : <ChevronUp size={15} />}</IconBtn>
          </div>
        )}
        <div ref={track} className="relative min-w-0" style={{ height: compact ? 34 : ROW.film }}>
          <FilmRow C={C} compact={compact} />
        </div>
        {!compact && open && LANES.map(l => (
          <LaneRow key={l.id} lane={l} C={C} phone={phone} onPop={setPop} />
        ))}
      </div>
      {!compact && <Playhead gut={gut} />}
      {pop && <LanePopover pop={pop} onClose={() => setPop(null)} />}
    </div>
  )
}

/* ---------------- playhead ---------------- */
function Playhead({ gut }: { gut: number }) {
  const T = useStudio(s => s.T), total = useStudio(s => s.C?.total || 1)
  return (
    <div className="pointer-events-none absolute bottom-0 top-0" style={{ left: gut, right: 0 }}>
      <div className="absolute bottom-0 top-0 w-[2px] -translate-x-1/2 bg-ember" style={{ left: `${(T / total) * 100}%` }}>
        <div className="absolute -left-[5px] top-0 h-0 w-0 border-x-[6px] border-t-[7px] border-x-transparent border-t-ember" />
      </div>
    </div>
  )
}

/* ---------------- shots row: seek, scrub, range notes, hover preview ---------------- */
function FilmRow({ C, compact }: { C: Ctx; compact?: boolean }) {
  const [el, w] = useWidth<HTMLDivElement>()
  const mode = useStudio(s => s.mode)
  const notes = useStudio(s => s.notes)
  const T = useStudio(s => s.T)
  const sel = useStudio(s => s.selNote)
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null)
  const [range, setRange] = useState<{ a: number; b: number } | null>(null)
  const drag = useRef<{ t0: number; x0: number; was: boolean; range: boolean; moved: boolean } | null>(null)
  const total = C.total
  const tAt = (cx: number) => { const r = el.current!.getBoundingClientRect(); return clamp(((cx - r.left) / r.width) * total, 0, total) }

  const down = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    capture(el.current!, e.pointerId)
    const t = tAt(e.clientX), isRange = mode === 'comment' || e.shiftKey
    drag.current = { t0: t, x0: e.clientX, was: ui.get().playing, range: isRange, moved: false }
    if (!isRange) { playback.pause(); playback.render(t) }
  }
  const move = (e: React.PointerEvent) => {
    const r = el.current!.getBoundingClientRect()
    setHover({ x: e.clientX - r.left, t: tAt(e.clientX) })
    const g = drag.current; if (!g) return
    if (Math.abs(e.clientX - g.x0) > 4) g.moved = true
    const t = tAt(e.clientX)
    if (g.range) { if (g.moved) setRange({ a: Math.min(g.t0, t), b: Math.max(g.t0, t) }) }
    else playback.render(t)
  }
  const up = (e: React.PointerEvent) => {
    const g = drag.current; drag.current = null; if (!g) return
    const t = tAt(e.clientX)
    if (g.range && g.moved) {
      const a = Math.min(g.t0, t), b = Math.max(g.t0, t)
      setRange(null)
      if (b - a > 0.15) {
        const sa = C.at(a), sb = C.at(b)
        ui.set({ draft: { kind: 'range', a, b, target: sa.i === sb.i ? `Part of shot ${sa.i + 1} (${sa.sc.name})` : `Shots ${sa.i + 1} to ${sb.i + 1}`, strokes: [], quick: [], scene: sa.sc.id, anchor: { x: e.clientX, y: el.current!.getBoundingClientRect().top } } })
        playback.seek(a)
      }
      return
    }
    if (g.range) { playback.seek(t); return }
    playback.render(t)
    if (g.was) playback.play()
  }

  const marks = useMemo(() => notes.map((n, i) => ({ n, i })), [notes])
  return (
    <div ref={el} className="absolute inset-0 cursor-pointer touch-none" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={() => setHover(null)}
      role="slider" aria-label="Film position" aria-valuemin={0} aria-valuemax={+total.toFixed(1)} aria-valuenow={+T.toFixed(1)} aria-valuetext={tc(T)} tabIndex={-1}>
      <div className={cx('absolute inset-x-0 flex', compact ? 'bottom-2 top-2.5' : 'bottom-1.5 top-3')}>
        {C.TL.map(r => {
          const on = T >= r.start && T < r.end
          return (
            <div key={r.sc.id} className={cx('relative h-full overflow-hidden border-r-2 border-panel first:rounded-l-md last:rounded-r-md last:border-r-0', on ? 'bg-hover' : 'bg-raise')} style={{ width: `${((r.end - r.start) / total) * 100}%` }}>
              {!compact && <span className={cx('absolute inset-0 flex items-center gap-1.5 truncate px-2 text-[11.5px] font-semibold', on ? 'text-fg' : 'text-muted')}><span className="mono text-dim">{r.i + 1}</span>{w * (r.end - r.start) / total > 64 && <span className="truncate">{r.sc.name}</span>}</span>}
            </div>
          )
        })}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-3">
        {marks.map(({ n, i }) => {
          const left = `${Math.min(100, (n.t / total) * 100)}%`
          if (n.t2 != null) return <div key={n.id} className={cx('absolute top-[3px] h-[5px] rounded-full', n.status === 'done' ? 'bg-mint/70' : 'bg-ember/80')} style={{ left, width: `${Math.max(0, Math.min(100, (n.t2 / total) * 100) - Math.min(100, (n.t / total) * 100))}%` }} title={n.text} />
          return <div key={n.id} className={cx('absolute top-[1px] h-[9px] w-[9px] -translate-x-1/2 rounded-full border-2 border-panel', n.status === 'done' ? 'bg-mint' : 'bg-ember', sel === n.id && 'scale-150')} style={{ left }} title={`${i + 1}. ${n.text}`} />
        })}
      </div>
      {range && <div className="pointer-events-none absolute bottom-1 top-1 rounded-md border-2 border-ember bg-ember/20" style={{ left: `${(range.a / total) * 100}%`, width: `${((range.b - range.a) / total) * 100}%` }} />}
      {compact && <div className="pointer-events-none absolute bottom-2 top-2.5 w-[3px] -translate-x-1/2 rounded bg-ember" style={{ left: `${(T / total) * 100}%` }} />}
      {hover && !drag.current?.range && <HoverPreview x={hover.x} t={hover.t} C={C} />}
    </div>
  )
}

/** A live thumbnail of the frame under the pointer. */
const HoverPreview = memo(function HoverPreview({ x, t, C }: { x: number; t: number; C: Ctx }) {
  const D = useStudio(s => s.M!.D)
  const host = useRef<HTMLDivElement>(null)
  const v = useRef<FilmViewer | null>(null)
  const W = 92, s = W / D.project.w, H = D.project.h * s
  useEffect(() => { if (!host.current) return; v.current = new FilmViewer(host.current, D, () => ui.get().C!); return () => { v.current?.destroy(); v.current = null } }, [D])
  useLayoutEffect(() => { v.current?.look(); v.current?.paint(t) }, [t, C])
  const r = C.at(t)
  return (
    <div className="pointer-events-none absolute bottom-full z-30 mb-2 -translate-x-1/2" style={{ left: x }}>
      <div className="overflow-hidden rounded-[8px] border border-line2 bg-black shadow-2xl" style={{ width: W, height: H }}>
        <div ref={host} className="origin-top-left" style={{ transform: `scale(${s})` }} />
      </div>
      <div className="mt-1 whitespace-nowrap rounded-md bg-black/85 px-1.5 py-0.5 text-center text-[11px] font-semibold"><span className="mono">{tc(t)}</span> · {r.i + 1} {r.sc.name}</div>
    </div>
  )
})

/* ---------------- sound lanes ---------------- */
function LaneRow({ lane, C, phone, onPop }: { lane: (typeof LANES)[number]; C: Ctx; phone: boolean; onPop: (p: Pop) => void }) {
  const mix = useStudio(s => s.mix)
  const solo = mix.solo === lane.id, muted = mix.mute[lane.id], db = mix.db[lane.id] || 0
  const silent = mix.solo ? !solo : muted
  return (
    <>
      <div className={cx('flex items-center gap-0.5 border-r border-t border-line px-1.5', phone && 'flex-col items-stretch justify-center gap-0 px-1')} style={{ height: phone ? ROW.lane + 8 : ROW.lane }}>
        <Tip title={lane.name} desc={lane.desc}><span className={cx('flex min-w-0 flex-1 items-center gap-1.5 truncate pl-0.5 text-[12.5px] font-semibold', silent ? 'text-dim' : 'text-fg', phone && 'text-[11px]')}><span className={cx('h-2 w-2 shrink-0 rounded-full', DOT[lane.id])} />{phone ? lane.short : lane.name}</span></Tip>
        <div className="flex items-center gap-0.5">
          <Tip title={solo ? 'Stop solo' : `Solo ${lane.name.toLowerCase()}`} desc={`Hear only the ${lane.name.toLowerCase()} lane`}>
            <button type="button" aria-pressed={solo} onClick={() => setMix({ solo: solo ? null : lane.id })} className={cx('grid h-6 w-6 place-items-center rounded-[6px] text-[11px] font-extrabold', solo ? 'bg-amber text-black' : 'text-muted hover:bg-hover')}>S</button>
          </Tip>
          <Tip title={muted ? `Unmute ${lane.name.toLowerCase()}` : `Mute ${lane.name.toLowerCase()}`} desc={`Silence the ${lane.name.toLowerCase()} lane while you review`}>
            <button type="button" aria-pressed={muted} onClick={() => setMix({ mute: { ...mix.mute, [lane.id]: !muted } })} className={cx('grid h-6 w-6 place-items-center rounded-[6px] text-[11px] font-extrabold', muted ? 'bg-ember text-ember-ink' : 'text-muted hover:bg-hover')}>M</button>
          </Tip>
          {!phone && (
            <Tip title={`${lane.name} volume`} desc={`Now ${db > 0 ? '+' : ''}${db.toFixed(1)} dB. Use − and + to change it by 1.5 dB; the change goes into the approved spec.`}>
              <span className="flex items-center">
                <button type="button" aria-label={`${lane.name} quieter`} onClick={() => laneVolume(lane.id, -1.5)} className="grid h-6 w-5 place-items-center rounded-[6px] text-muted hover:bg-hover"><Minus size={12} /></button>
                <span className={cx('mono w-[30px] text-center text-[10.5px]', db !== 0 ? 'text-sky' : 'text-dim')}>{db === 0 ? '0' : (db > 0 ? '+' : '') + db.toFixed(1)}</span>
                <button type="button" aria-label={`${lane.name} louder`} onClick={() => laneVolume(lane.id, 1.5)} className="grid h-6 w-5 place-items-center rounded-[6px] text-muted hover:bg-hover"><Plus size={12} /></button>
              </span>
            </Tip>
          )}
        </div>
      </div>
      <div className="relative min-w-0 border-t border-line" style={{ height: phone ? ROW.lane + 8 : ROW.lane, opacity: silent ? 0.4 : 1 }}>
        {lane.id === 'vo' && <VoLane C={C} onPop={onPop} />}
        {lane.id === 'music' && <MusicLane C={C} />}
        {lane.id === 'sfx' && <SfxLane C={C} onPop={onPop} />}
      </div>
    </>
  )
}

function usePeaks(src?: string | null): Peaks | null {
  const [, force] = useState(0)
  useEffect(() => audio.onPeaks(() => force(n => n + 1)), [])
  useEffect(() => { if (src) audio.peaks(src) }, [src])
  return audio.peaksNow(src) || null
}

function Wave({ peaks, from = 0, to, className, h = 1 }: { peaks: Peaks | null; from?: number; to?: number; className?: string; h?: number }) {
  if (!peaks) return <div className={cx('absolute inset-x-0 top-1/2 h-px bg-current opacity-40', className)} />
  const end = to ?? peaks.dur, n = peaks.p.length
  const i0 = Math.floor((from / peaks.dur) * n), i1 = Math.min(n, Math.ceil((end / peaks.dur) * n))
  const seg = peaks.p.slice(i0, i1), m = Math.max(0.05, ...seg)
  const pts = seg.map((p, i) => `${(i / Math.max(1, seg.length - 1)) * 100},${50 - (p / m) * 46 * h}`)
  const low = seg.map((p, i) => `${(i / Math.max(1, seg.length - 1)) * 100},${50 + (p / m) * 46 * h}`).reverse()
  return (
    <svg className={cx('absolute inset-0 h-full w-full', className)} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <polygon points={[...pts, ...low].join(' ')} fill="currentColor" />
    </svg>
  )
}

function commentOn(key: string, target: string, a: number, e: { clientX: number; clientY: number }) {
  ui.set({ draft: { kind: 'sound', a, key, target, strokes: [], quick: [], scene: ui.get().C!.at(a).sc.id, anchor: { x: e.clientX, y: e.clientY } } })
  playback.pause()
}

function VoLane({ C, onPop }: { C: Ctx; onPop: (p: Pop) => void }) {
  const mode = useStudio(s => s.mode)
  return (
    <div className="absolute inset-0" onPointerDown={e => { if (e.target === e.currentTarget) seekFromLane(e, C) }}>
      {C.vo().map(v => <VoBlock key={v.r.sc.id} v={v} total={C.total} onClick={e => {
        const key = `${v.r.sc.id}.vo`
        if (mode === 'comment') commentOn(key, `Voice line ${v.r.i + 1}: “${cleanText(v.o.text)}”`, v.a, e)
        else { playback.seek(v.a - 0.05); onPop({ key, x: e.clientX, y: e.currentTarget.getBoundingClientRect().top }) }
      }} />)}
    </div>
  )
}
function VoBlock({ v, total, onClick }: { v: ReturnType<Ctx['vo']>[number]; total: number; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void }) {
  const peaks = usePeaks(v.o.src)
  const dur = peaks?.dur || v.b - v.a
  return (
    <Tip title={`Sarah · shot ${v.r.i + 1}`} desc={`“${cleanText(v.o.text)}” Click to change the line or comment on it.`}>
      <button type="button" onClick={onClick} className="absolute bottom-1.5 top-1.5 overflow-hidden rounded-[6px] bg-sky/20 text-sky ring-sky/70 hover:bg-sky/30 hover:ring-1" style={{ left: `${(v.a / total) * 100}%`, width: `max(8px, ${(dur / total) * 100}%)` }} data-lane="vo" aria-label={`Voice line, shot ${v.r.i + 1}: ${cleanText(v.o.text)}`}>
        <Wave peaks={peaks} className="text-sky/70" />
      </button>
    </Tip>
  )
}

function MusicLane({ C }: { C: Ctx }) {
  const m = C.o('music'), peaks = usePeaks(m?.src), mode = useStudio(s => s.mode), duck = useStudio(s => s.mix.duck)
  const beats = C.beats(), total = C.total, vo = C.vo()
  const duckPts = useMemo(() => {
    if (!duck) return '0,20 100,20'
    const p: string[] = ['0,20']
    vo.forEach(v => { const a = ((v.a - 0.12) / total) * 100, b = (v.a / total) * 100, c = (v.b / total) * 100, d = ((v.b + 0.25) / total) * 100; p.push(`${a},20`, `${b},58`, `${c},58`, `${d},20`) })
    p.push('100,20'); return p.join(' ')
  }, [vo, total, duck])
  return (
    <div className="absolute inset-0 cursor-pointer text-amber" onPointerDown={e => {
      const t = timeAt(e, total)
      if (mode === 'comment') commentOn('music', `Music: ${optLabel(m)} at ${tc(t)}`, t, e)
      else seekFromLane(e, C)
    }}>
      <Wave peaks={peaks} to={Math.min(total, peaks?.dur ?? total)} className="text-amber/35" h={0.9} />
      {peaks && peaks.dur < total && <div className="absolute inset-y-0 right-0 bg-ink/50" style={{ left: `${(peaks.dur / total) * 100}%` }} />}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <polyline points={duckPts} fill="none" stroke="var(--color-amber)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2">
        {beats.map((b, i) => <span key={i} className={cx('absolute bottom-0 w-px -translate-x-1/2', i % 4 === 0 ? 'h-2 bg-amber/80' : 'h-1 bg-amber/40')} style={{ left: `${(b / total) * 100}%` }} />)}
      </div>
      <DuckToggle />
    </div>
  )
}

function DuckToggle() {
  const duck = useStudio(s => s.mix.duck)
  return (
    <Tip title={duck ? 'Music dips under the voice' : 'Music stays level'} desc="When on, the music gets about 8 dB quieter while Sarah speaks, so every word is clear. The line on the music lane shows the dip.">
      <button type="button" aria-pressed={duck} onPointerDown={e => e.stopPropagation()} onClick={() => setTweak('mix.duck', { on: !duck }, duck ? 'Music stays level' : 'Music dips under voice')}
        className={cx('absolute right-1 top-1 flex h-[22px] items-center gap-1 rounded-[6px] px-1.5 text-[10.5px] font-bold', duck ? 'bg-amber/20 text-amber' : 'bg-raise text-dim')}>
        <ArrowDownToLine size={11} />Dip
      </button>
    </Tip>
  )
}

function SfxLane({ C, onPop }: { C: Ctx; onPop: (p: Pop) => void }) {
  const evs = C.sfx().filter(s => s.o?.src)
  return (
    <div className="absolute inset-0" onPointerDown={e => { if (e.target === e.currentTarget) seekFromLane(e, C) }}>
      {evs.map(s => <SfxMark key={`${s.key}:${s.j}`} s={s} C={C} onPop={onPop} />)}
    </div>
  )
}

function SfxMark({ s, C, onPop }: { s: ReturnType<Ctx['sfx']>[number]; C: Ctx; onPop: (p: Pop) => void }) {
  const peaks = usePeaks(s.o?.src)
  const mode = useStudio(s2 => s2.mode)
  const fps = useStudio(s2 => s2.M?.D.project.fps || 30)
  const [drag, setDrag] = useState<{ x0: number; d: number; w: number; snapped: boolean } | null>(null)
  const total = C.total, dur = Math.min(peaks?.dur || 0.4, 1.6)
  const base = ui.get().tweaks[s.key]?.dt || 0
  const left = s.a + (drag?.d || 0)
  const down = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return
    e.stopPropagation(); capture(e.currentTarget, e.pointerId)
    setDrag({ x0: e.clientX, d: 0, w: e.currentTarget.parentElement!.getBoundingClientRect().width, snapped: false })
  }
  const move = (e: React.PointerEvent) => {
    if (!drag) return
    let d = ((e.clientX - drag.x0) / drag.w) * total
    let snapped = false
    if (!e.altKey) { const bt = C.beats(), at = s.a + d; let best = Infinity; bt.forEach(b => { if (Math.abs(b - at) < Math.abs(best - at)) best = b }); if (Math.abs(best - at) < 0.07) { d = best - s.a; snapped = true } }
    if (!snapped) d = Math.round(d * fps) / fps
    setDrag({ ...drag, d, snapped })
  }
  const up = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = drag; setDrag(null); if (!g) return
    if (Math.abs(e.clientX - g.x0) < 4) {
      if (mode === 'comment') commentOn(s.key, `Sound: ${s.x.label} (shot ${s.r.i + 1})`, s.a, e)
      else { playback.seek(Math.max(0, s.a - 0.6)); onPop({ key: s.key, x: e.clientX, y: e.currentTarget.getBoundingClientRect().top }) }
      return
    }
    setTweak(s.key, { dt: +(base + g.d).toFixed(3) }, `Moved ${s.x.label}`)
    playback.play(Math.max(0, s.a + g.d - 1), Math.min(total, s.a + g.d + 1))
  }
  const ms = drag ? Math.round(drag.d * 1000) : 0
  const off = beatOffsetMs(C, s.key)
  return (
    <Tip title={s.x.label} desc={`${optLabel(s.o)} · shot ${s.r.i + 1}${off != null ? ` · ${Math.abs(off) <= 15 ? 'on the beat' : `${Math.abs(off)} ms ${off > 0 ? 'after' : 'before'} the beat`}` : ''}. Drag to move it (snaps to beats, hold Alt for free), click to swap or comment.`}>
      <button type="button" onPointerDown={down} onPointerMove={move} onPointerUp={up} data-lane="sfx" aria-label={`${s.x.label}${s.j ? ` (repeat ${s.j + 1})` : ''}`}
        className={cx('absolute bottom-1.5 top-1.5 cursor-grab touch-none overflow-hidden rounded-[5px] bg-mint/20 text-mint ring-mint hover:ring-1', drag && 'cursor-grabbing ring-2', s.j > 0 && 'top-3')}
        style={{ left: `${(left / total) * 100}%`, width: `max(7px, ${(dur / total) * 100}%)` }}>
        <span className="absolute inset-y-0 left-0 w-[2px] bg-mint" />
        <Wave peaks={peaks} to={dur} className="text-mint/60" />
        {drag && <span className="mono absolute -top-0.5 left-2 whitespace-nowrap text-[10px] font-bold text-fg">{drag.snapped ? 'beat' : `${ms > 0 ? '+' : ''}${ms} ms`}</span>}
      </button>
    </Tip>
  )
}

const timeAt = (e: { clientX: number; currentTarget: EventTarget & Element }, total: number) => { const r = e.currentTarget.getBoundingClientRect(); return clamp(((e.clientX - r.left) / r.width) * total, 0, total) }
function seekFromLane(e: React.PointerEvent<HTMLDivElement>, C: Ctx) { playback.seek(timeAt(e, C.total)) }

/* ---------------- a lane item's own card ---------------- */
function LanePopover({ pop, onClose }: { pop: Pop; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: -9999, top: -9999 })
  useLayoutEffect(() => {
    const el = box.current; if (!el) return
    const w = el.offsetWidth, h = el.offsetHeight
    setPos({ left: clamp(pop.x - w / 2, 8, innerWidth - w - 8), top: clamp(pop.y - h - 10, 8, innerHeight - h - 8) })
  }, [pop])
  useOutside([box], onClose)
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }; addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [onClose])
  const d = useStudio(s => s.M?.DEC[pop.key]), C = useStudio(s => s.C)
  if (!d || !C) return null
  const at = d.kind === 'vo' ? C.vo().find(v => `${v.r.sc.id}.vo` === pop.key)?.a ?? 0 : C.sfx().find(s => s.key === pop.key)?.a ?? 0
  return (
    <div ref={box} className="pop fixed z-[90] flex max-h-[70vh] w-[360px] max-w-[calc(100vw-16px)] flex-col gap-2 overflow-auto p-3" style={pos} onKeyDown={e => e.stopPropagation()}>
      <ChoiceCard k={pop.key} dense />
      <div className="flex justify-end">
        <button type="button" className="btn btn-sm btn-ember" onClick={e => { onClose(); commentOn(pop.key, d.kind === 'vo' ? `Voice line: ${d.q}` : `Sound: ${d.q}`, at, e) }}><MessageSquarePlus size={14} />Comment on this</button>
      </div>
    </div>
  )
}
