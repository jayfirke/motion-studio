import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Camera, Clapperboard, Columns3, LayoutGrid, Maximize2, MessageSquarePlus, Mic, MonitorPlay, Pause, Play, Rows3, Square, Volume2 } from 'lucide-react'
import { setView, ui, useStudio } from '../../state/store'
import { FilmViewer } from '../../engine/viewer'
import { playback } from '../../engine/playback'
import { cleanText, optLabel } from '../../data/model'
import type { Scene } from '../../data/types'
import { IconBtn, Tip } from '../ui'
import { Still } from './Still'
import { ShotSheet } from './ShotSheet'
import { cx, store as ls, tc } from '../../lib/util'
import { usePhone, useWidth } from '../../lib/hooks'

type Layout = 'grid' | 'strip' | 'script'

/** The storyboard: every shot as a card (grid), a film strip with its transitions, or a script table. Shots play in place. */
export function Storyboard() {
  const M = useStudio(s => s.M)!
  const C = useStudio(s => s.C)!
  const phone = usePhone()
  const [layout, setLayout] = useState<Layout>(() => ls.get<Layout>('studio2:board-layout') || 'grid')
  const [auto, setAuto] = useState<number | null>(null)
  const [size, setSize] = useState<'s' | 'm' | 'l'>(() => (matchMedia('(max-width: 639px)').matches ? 's' : 'm'))
  useEffect(() => () => { if (playback.shotPlaying) playback.endShot() }, [])
  const ended = useCallback((i: number) => setAuto(a => (a != null && a === i ? (i + 1 < M.D.scenes.length ? i + 1 : null) : a)), [M])
  const pickLayout = (l: Layout) => { setLayout(l); ls.set('studio2:board-layout', l); setAuto(null); playback.endShot() }
  const min = size === 's' ? 140 : size === 'm' ? 200 : 300
  const [grid, gw] = useWidth<HTMLOListElement>()
  // Balanced rows: never leave one shot alone on the last row.
  const n = M.D.scenes.length, fit = Math.max(1, Math.min(n, Math.floor((gw + 16) / (min + 16)))), cols = Math.ceil(n / Math.ceil(n / fit))
  const voice = C.o('voice')
  return (
    <div className="h-full min-w-0 flex-1 overflow-y-auto" data-testid="board">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 basis-full sm:flex-1 sm:basis-auto">
            <h2 className="text-[22px] font-bold leading-tight">Storyboard</h2>
            <p className="mt-0.5 text-[13.5px] text-muted">{M.D.scenes.length} shots · {C.total.toFixed(1)} s · {M.D.project.format} · narrated by {voice?.name || 'Sarah'}{phone ? '' : '. Press play on a shot to watch it right here; open the shot sheet for everything about it.'}</p>
          </div>
          <div className="seg" role="group" aria-label="Layout">
            <Tip title="Grid" desc="Every shot as a card"><button type="button" aria-pressed={layout === 'grid'} onClick={() => pickLayout('grid')} data-layout="grid"><LayoutGrid size={14} />{!phone && 'Grid'}</button></Tip>
            <Tip title="Film strip" desc="Shots in a row, sized by length, with how each one begins"><button type="button" aria-pressed={layout === 'strip'} onClick={() => pickLayout('strip')} data-layout="strip"><Columns3 size={14} />{!phone && 'Strip'}</button></Tip>
            <Tip title="Script" desc="A table: picture, narration, sound and camera for every shot"><button type="button" aria-pressed={layout === 'script'} onClick={() => pickLayout('script')} data-layout="script"><Rows3 size={14} />{!phone && 'Script'}</button></Tip>
          </div>
          {layout === 'grid' && (
            <Tip title="Card size" desc="Bigger frames for detail, smaller to see the whole film at once">
              <div className="seg">{(['s', 'm', 'l'] as const).map(s => <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className="uppercase">{s}</button>)}</div>
            </Tip>
          )}
          {layout !== 'script' && (auto == null
            ? <button type="button" className="btn btn-primary" onClick={() => setAuto(0)} data-testid="play-all"><Play size={15} fill="currentColor" />Play all shots</button>
            : <button type="button" className="btn" onClick={() => { setAuto(null); playback.endShot() }}><Square size={13} fill="currentColor" />Stop</button>)}
        </div>
        {layout === 'grid' && (
          <ol ref={grid} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {M.D.scenes.map((sc, i) => <ShotCard key={sc.id} sc={sc} i={i} auto={auto === i} onEnded={ended} />)}
          </ol>
        )}
        {layout === 'strip' && <Strip auto={auto} onEnded={ended} />}
        {layout === 'script' && <Script />}
      </div>
      <ShotSheet />
    </div>
  )
}

/** Shared play-in-place behaviour for a shot's own viewer. */
function useShotPlayer(sc: Scene, i: number, onEnded: (i: number) => void, key: number) {
  const v = useRef<FilmViewer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [prog, setProg] = useState(0)
  const play = useCallback(() => {
    const vv = v.current; if (!vv) return
    const rr = ui.get().C!.of(sc.id)
    setPlaying(true)
    playback.playShot(vv, rr.start, rr.end, t => { vv.still(sc.id, (t - rr.start) / rr.k); setProg((t - rr.start) / (rr.end - rr.start)) }, () => { setPlaying(false); setProg(0); vv.still(sc.id, key); onEnded(i) })
  }, [sc.id, key, i, onEnded])
  return { v, playing, prog, play, stop: () => playback.endShot() }
}

function ShotCard({ sc, i, auto, onEnded }: { sc: Scene; i: number; auto: boolean; onEnded: (i: number) => void }) {
  const M = useStudio(s => s.M)!
  const C = useStudio(s => s.C)!
  const nNotes = useStudio(s => s.notes.filter(n => n.scene === sc.id && n.status !== 'done').length)
  const box = useRef<HTMLDivElement>(null)
  const host = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.2)
  const W = M.D.project.w, H = M.D.project.h
  const r = C.of(sc.id)
  const key = sc.key ?? sc.dur * 0.6
  const { v, playing, prog, play, stop } = useShotPlayer(sc, i, onEnded, key)
  const beat = M.D.story?.find(b => b.scene === sc.id)
  const vo = C.vo().find(x => x.r.sc.id === sc.id), cam = C.o(`${sc.id}.camera`), tr = C.o(`${sc.id}.transition`)
  const sfx = (sc.sfx || []).map(x => ({ x, o: C.o(`${sc.id}.${x.id}`) })).filter(s => s.o?.src)

  useEffect(() => {
    if (!host.current) return
    const vv = new FilmViewer(host.current, M.D, () => ui.get().C!)
    v.current = vv; vv.still(sc.id, key)
    return () => { if (playback.shotActive(vv)) playback.endShot(); vv.destroy(); v.current = null }
  }, [M.D, sc.id, key]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const vv = v.current; if (!vv) return; vv.look(); if (!playback.shotActive(vv)) vv.still(sc.id, key) }, [C, sc.id, key]) // eslint-disable-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = box.current; if (!el) return
    const fit = () => setScale(el.clientWidth / W)
    fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect()
  }, [W])
  useEffect(() => { if (auto && !playing) { box.current?.closest('li')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); play() } }, [auto]) // eslint-disable-line react-hooks/exhaustive-deps
  const scrub = (e: React.PointerEvent) => { if (playing || !v.current || e.pointerType === 'touch') return; const b = e.currentTarget.getBoundingClientRect(); v.current.still(sc.id, ((e.clientX - b.left) / b.width) * sc.dur) }
  const comment = (e: React.MouseEvent) => { const b = e.currentTarget.getBoundingClientRect(); ui.set({ draft: { kind: 'shot', a: r.start, b: r.end, target: `Shot ${i + 1}: ${sc.name}`, scene: sc.id, strokes: [], quick: [], category: 'story', anchor: { x: b.left + b.width / 2, y: b.top } } }) }
  const open = () => { ui.set({ T: r.start + key * r.k }); setView('watch'); requestAnimationFrame(() => playback.seek(r.start + key * r.k)) }

  return (
    <li className={cx('card flex flex-col overflow-hidden', (playing || auto) && 'border-sky/70 ring-1 ring-sky/40')} data-shot={sc.id}>
      <div ref={box} className="group relative w-full overflow-hidden bg-black" style={{ aspectRatio: `${W} / ${H}` }} onPointerMove={scrub} onPointerLeave={() => { if (!playing) v.current?.still(sc.id, key) }}>
        <div ref={host} className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
          <span className="mono grid h-7 min-w-7 place-items-center rounded-[8px] bg-black/70 px-1.5 text-[13px] font-bold text-white">{i + 1}</span>
          {nNotes > 0 && <span className="rounded-full bg-ember px-2 py-0.5 text-[11px] font-extrabold text-ember-ink">{nNotes} note{nNotes > 1 ? 's' : ''}</span>}
        </div>
        <button type="button" onClick={playing ? stop : play} aria-label={playing ? `Stop shot ${i + 1}` : `Play shot ${i + 1}`} data-testid={`play-shot-${i + 1}`}
          className={cx('absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#111] shadow-xl transition-opacity', playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-90 group-hover:opacity-100')}>
          {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
        </button>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40"><div className="h-full bg-ember" style={{ width: `${prog * 100}%` }} /></div>
        {playing && <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white"><Volume2 size={12} />with sound</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <button type="button" className="text-left" onClick={() => ui.set({ sheet: sc.id })} title="Open the shot sheet">
          {beat && <div className="label text-sky">{beat.beat}</div>}
          <div className="flex items-baseline gap-2"><h3 className="min-w-0 flex-1 truncate text-[15.5px] font-bold hover:underline">{sc.name}</h3><span className="mono text-[12px] text-dim">{(r.end - r.start).toFixed(1)} s</span></div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-raise"><div className="h-full rounded-full bg-sky/60" style={{ marginLeft: `${(r.start / C.total) * 100}%`, width: `${((r.end - r.start) / C.total) * 100}%` }} /></div>
          {beat && <p className="mt-1.5 text-[12.5px] italic leading-snug">“{beat.viewer}”</p>}
          <p className="mt-0.5 line-clamp-3 text-[12.5px] leading-snug text-muted">{sc.purpose}</p>
        </button>
        {vo && <p className="flex gap-1.5 text-[13px] italic leading-snug"><Mic size={13} className="mt-[3px] shrink-0 text-sky" />“{cleanText(vo.o.text)}”{vo.missing && <span className="tag tag-amber not-italic text-[10px]">not recorded</span>}</p>}
        <div className="flex flex-wrap gap-1">
          {tr && i > 0 && <Tip title="How this shot begins" desc={cleanText(tr.why)}><span className="tag"><Clapperboard size={11} />{optLabel(tr)}</span></Tip>}
          {cam && <Tip title="Camera" desc={cleanText(cam.why)}><span className="tag"><Camera size={11} />{optLabel(cam)}</span></Tip>}
          {sfx.map(s => <Tip key={s.x.id} title={s.x.label} desc={optLabel(s.o)}><span className="tag"><Volume2 size={11} />{s.x.label}</span></Tip>)}
        </div>
        <div className="mt-auto flex items-center gap-1 pt-1">
          <Tip title="Shot sheet" desc="Everything about this shot: a filmstrip, all its choices, its sounds and comments"><button type="button" className="btn btn-sm" onClick={() => ui.set({ sheet: sc.id })} data-testid={`sheet-${i + 1}`}><Maximize2 size={13} />Shot sheet</button></Tip>
          <IconBtn small label="Comment on this shot" desc="A comment about the whole shot: its idea, length or order" onClick={comment}><MessageSquarePlus size={15} /></IconBtn>
          <span className="flex-1" />
          <IconBtn small label="Open in the player" desc="Watch this shot in the full player with the timeline" onClick={open}><MonitorPlay size={15} /></IconBtn>
        </div>
      </div>
    </li>
  )
}

/** Shots in a row, widths in proportion to their length, with each transition between them. */
function Strip({ auto, onEnded }: { auto: number | null; onEnded: (i: number) => void }) {
  const M = useStudio(s => s.M)!
  const C = useStudio(s => s.C)!
  return (
    <div className="overflow-x-auto pb-3" data-testid="strip">
      <ol className="flex min-w-max items-stretch gap-0">
        {M.D.scenes.map((sc, i) => {
          const r = C.of(sc.id), tr = C.o(`${sc.id}.transition`)
          return (
            <li key={sc.id} className="flex items-stretch">
              {i > 0 && (
                <Tip title="How this shot begins" desc={cleanText(tr?.why)}>
                  <div className="flex w-[70px] flex-col items-center justify-center gap-1 px-1 text-center"><ArrowRight size={16} className="text-dim" /><span className="text-[11px] font-semibold leading-tight text-muted">{optLabel(tr) || 'Cut'}</span></div>
                </Tip>
              )}
              <StripShot sc={sc} i={i} width={Math.max(150, (r.end - r.start) * 62)} auto={auto === i} onEnded={onEnded} />
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function StripShot({ sc, i, width, auto, onEnded }: { sc: Scene; i: number; width: number; auto: boolean; onEnded: (i: number) => void }) {
  const C = useStudio(s => s.C)!
  const r = C.of(sc.id), key = sc.key ?? sc.dur * 0.6
  const { v, playing, prog, play, stop } = useShotPlayer(sc, i, onEnded, key)
  const vo = C.vo().find(x => x.r.sc.id === sc.id)
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => { if (auto && !playing) { el.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); play() } }, [auto]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={el} className={cx('card flex flex-col overflow-hidden', (playing || auto) && 'border-sky/70')} style={{ width }} data-shot={sc.id}>
      <div className="group relative mx-auto w-[150px]">
        <Still sceneId={sc.id} u={key} onViewer={vv => { v.current = vv }} />
        <button type="button" onClick={playing ? stop : play} aria-label={playing ? 'Stop' : `Play shot ${i + 1}`} className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#111] opacity-90 shadow-lg group-hover:opacity-100">{playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}</button>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40"><div className="h-full bg-ember" style={{ width: `${prog * 100}%` }} /></div>
      </div>
      <button type="button" className="flex flex-1 flex-col gap-1 p-2.5 text-left" onClick={() => ui.set({ sheet: sc.id })}>
        <div className="flex items-baseline gap-1.5"><span className="mono text-[11px] text-dim">{i + 1}</span><b className="truncate text-[13.5px]">{sc.name}</b><span className="mono ml-auto text-[11px] text-dim">{tc(r.start)}</span></div>
        {vo && <p className="line-clamp-2 text-[12px] italic leading-snug text-muted">“{cleanText(vo.o.text)}”</p>}
      </button>
    </div>
  )
}

/** The film as a script: picture, narration, sound and camera, one row per shot. */
function Script() {
  const M = useStudio(s => s.M)!
  const C = useStudio(s => s.C)!
  const notes = useStudio(s => s.notes)
  const voice = C.o('voice')
  return (
    <div className="overflow-x-auto" data-testid="script">
      <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-[13px]">
        <thead className="text-dim"><tr>{['#', 'Picture', 'Shot', `Narration · ${voice?.name || 'Sarah'}`, 'Sound', 'Camera and cut', 'Time', ''].map(h => <th key={h} className="border-b border-line px-2 py-2 font-semibold">{h}</th>)}</tr></thead>
        <tbody>
          {M.D.scenes.map((sc, i) => {
            const r = C.of(sc.id), vo = C.vo().find(x => x.r.sc.id === sc.id), cam = C.o(`${sc.id}.camera`), tr = C.o(`${sc.id}.transition`)
            const sfx = (sc.sfx || []).map(x => ({ x, o: C.o(`${sc.id}.${x.id}`) })).filter(s => s.o?.src)
            const nn = notes.filter(n => n.scene === sc.id && n.status !== 'done').length
            return (
              <tr key={sc.id} className="align-top">
                <td className="border-b border-line px-2 py-3 mono text-dim">{i + 1}</td>
                <td className="w-[86px] border-b border-line px-2 py-3"><button type="button" className="block w-[70px] overflow-hidden rounded-[6px]" onClick={() => ui.set({ sheet: sc.id })} aria-label={`Open shot ${i + 1}`}><Still sceneId={sc.id} u={sc.key ?? sc.dur * 0.6} /></button></td>
                <td className="border-b border-line px-2 py-3"><b className="text-[14px]">{sc.name}</b><p className="mt-0.5 max-w-[30ch] text-muted">{sc.purpose}</p></td>
                <td className="border-b border-line px-2 py-3 italic">{vo ? `“${cleanText(vo.o.text)}”` : '–'}{vo?.missing && <span className="tag tag-amber ml-1 not-italic text-[10px]">not recorded</span>}</td>
                <td className="border-b border-line px-2 py-3 text-muted">{sfx.length ? sfx.map(s => s.x.label).join(', ') : 'Silence'}</td>
                <td className="border-b border-line px-2 py-3 text-muted">{optLabel(cam)}{i > 0 && <><br /><span className="text-dim">In: {optLabel(tr)}</span></>}</td>
                <td className="border-b border-line px-2 py-3 mono text-muted">{tc(r.start)}<br /><span className="text-dim">{(r.end - r.start).toFixed(1)} s</span></td>
                <td className="border-b border-line px-2 py-3">{nn > 0 && <span className="tag tag-ember">{nn}</span>}<button type="button" className="btn btn-sm ml-1" onClick={() => ui.set({ sheet: sc.id })}><Maximize2 size={13} /></button></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
