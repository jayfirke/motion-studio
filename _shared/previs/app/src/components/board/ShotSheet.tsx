import * as Dialog from '@radix-ui/react-dialog'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Film, MessageSquare, MonitorPlay, Mic, Pause, Play, SlidersHorizontal, Volume2, X } from 'lucide-react'
import { addNote, setView, ui, useStudio } from '../../state/store'
import { beatOffsetMs, cleanText, optLabel } from '../../data/model'
import type { FilmViewer } from '../../engine/viewer'
import { playback } from '../../engine/playback'
import { ChoiceCard, Preview } from '../choices/ChoiceCard'
import { Still } from './Still'
import { IconBtn, Tip } from '../ui'
import { usePhone } from '../../lib/hooks'
import { cx, tc } from '../../lib/util'

const TRUTH: Record<string, string> = { conceptual_ui: 'Made-up screen', conceptual_visual: 'Concept visual', external_footage: 'Stock footage', own_footage: 'Our own earlier films', placeholder_ui: 'Stand-in screen: the build records the real app', real_ui: 'Real product UI' }
type Tab = 'overview' | 'choices' | 'sound' | 'notes'

/** The full sheet for one shot: a playable frame with a filmstrip, and everything decided about the shot. */
export function ShotSheet() {
  const id = useStudio(s => s.sheet)
  if (!id) return null
  return (
    <Dialog.Root open onOpenChange={o => { if (!o) { playback.endShot(); ui.set({ sheet: null }) } }}>
      <Dialog.Portal>
        <Dialog.Overlay className="scrim !z-[100]" />
        <Dialog.Content aria-describedby={undefined} onOpenAutoFocus={e => e.preventDefault()} className="pop fixed left-1/2 top-1/2 z-[101] flex h-[min(92vh,900px)] w-[min(1180px,calc(100vw-16px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden outline-none" data-testid="shot-sheet">
          <Sheet id={id} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Sheet({ id }: { id: string }) {
  const M = useStudio(s => s.M)!
  const C = useStudio(s => s.C)!
  const phone = usePhone()
  const [tab, setTab] = useState<Tab>('overview')
  const i = M.D.scenes.findIndex(s => s.id === id)
  const sc = M.D.scenes[i], r = C.of(id)
  const go = useCallback((d: number) => { const n = M.D.scenes[i + d]; if (n) { playback.endShot(); ui.set({ sheet: n.id }) } }, [M, i])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.target as HTMLElement).closest('input,textarea,select')) return; if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [go])
  const beat = M.D.story?.find(b => b.scene === id)
  const tabs: [Tab, string, typeof Film][] = [['overview', 'Overview', Film], ['choices', 'Choices', SlidersHorizontal], ['sound', 'Sound', Volume2], ['notes', 'Notes', MessageSquare]]
  return (
    <>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <IconBtn small label="Previous shot" keys={['←']} disabled={i === 0} onClick={() => go(-1)}><ChevronLeft size={17} /></IconBtn>
        <div className="min-w-0 flex-1">
          <div className="label">{beat?.beat || 'Shot'} · shot {i + 1} of {M.D.scenes.length} · {tc(r.start)}–{tc(r.end)}</div>
          <Dialog.Title className="truncate text-[18px] font-bold leading-tight">{sc.name}</Dialog.Title>
        </div>
        <IconBtn small label="Next shot" keys={['→']} disabled={i === M.D.scenes.length - 1} onClick={() => go(1)}><ChevronRight size={17} /></IconBtn>
        <Tip title="Open in the player" desc="Watch this shot in the full player with the timeline"><button type="button" className="btn btn-sm" onClick={() => { const t = r.start + (sc.key ?? 0) * r.k; ui.set({ sheet: null, T: t }); setView('watch'); requestAnimationFrame(() => playback.seek(t)) }}><MonitorPlay size={14} />{!phone && 'Player'}</button></Tip>
        <Dialog.Close className="icon-btn icon-btn-sm" aria-label="Close"><X size={17} /></Dialog.Close>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(240px,0.9fr)_1.4fr] md:overflow-hidden">
        <SheetPlayer key={id} id={id} />
        <div className="flex min-h-0 flex-col border-line md:border-l">
          <div className="seg mx-4 mt-3 shrink-0" role="tablist" aria-label="Shot sheet">
            {tabs.map(([t, l, I]) => <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className="flex-1 justify-center !px-2"><I size={14} />{l}</button>)}
          </div>
          <div className="min-h-0 flex-1 px-4 py-3 md:overflow-y-auto" data-testid="sheet-body">
            {tab === 'overview' && <Overview id={id} />}
            {tab === 'choices' && <div className="flex flex-col gap-3">{M.ORDER.filter(k => M.DEC[k].scene === id).map(k => <ChoiceCard key={k} k={k} />)}</div>}
            {tab === 'sound' && <Sound id={id} />}
            {tab === 'notes' && <Notes id={id} />}
          </div>
        </div>
      </div>
    </>
  )
}

/** The shot, playable with sound, plus a filmstrip of six moments to jump between. */
function SheetPlayer({ id }: { id: string }) {
  const M = useStudio(s => s.M)!
  const C = useStudio(s => s.C)!
  const sc = M.D.scenes.find(s => s.id === id)!
  const r = C.of(id)
  const v = useRef<FilmViewer | null>(null)
  const [u, setU] = useState(sc.key ?? sc.dur * 0.6)
  const [playing, setPlaying] = useState(false)
  const frames = Array.from({ length: 6 }, (_, j) => +(((j + 0.5) / 6) * sc.dur).toFixed(2))
  const play = () => {
    const vv = v.current; if (!vv) return
    const rr = ui.get().C!.of(id)
    setPlaying(true)
    playback.playShot(vv, rr.start, rr.end, t => { const lu = (t - rr.start) / rr.k; vv.still(id, lu); setU(lu) }, () => { setPlaying(false) })
  }
  const seek = (x: number) => { if (playback.shotActive(v.current!)) playback.endShot(); setU(x); v.current?.still(id, x) }
  return (
    <div className="flex flex-col gap-3 p-4 md:overflow-y-auto">
      <div className="mx-auto w-full max-w-[300px]">
        <div className="group relative overflow-hidden rounded-[10px] frame-shadow">
          <Still sceneId={id} u={u} onViewer={vv => { v.current = vv }} />
          <button type="button" onClick={() => (playing ? playback.endShot() : play())} aria-label={playing ? 'Stop' : 'Play this shot'} className={cx('absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#111] shadow-xl transition-opacity', playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-95')} data-testid="sheet-play">
            {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input type="range" min={0} max={sc.dur} step={0.01} value={u} onChange={e => seek(+e.target.value)} className="flex-1 accent-[var(--color-ember)]" aria-label="Scrub this shot" />
          <span className="mono w-[78px] text-right text-[12px] text-muted">{tc(r.start + u * r.k)}</span>
        </div>
      </div>
      <div>
        <div className="label mb-1.5">Filmstrip</div>
        <div className="grid grid-cols-6 gap-1.5">
          {frames.map(f => (
            <button key={f} type="button" onClick={() => seek(f)} className={cx('overflow-hidden rounded-[6px] border-2', Math.abs(u - f) < sc.dur / 12 ? 'border-ember' : 'border-transparent')} aria-label={`Frame at ${tc(r.start + f * r.k)}`}>
              <Still sceneId={id} u={f} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Overview({ id }: { id: string }) {
  const M = useStudio(s => s.M)!
  const C = useStudio(s => s.C)!
  const sc = M.D.scenes.find(s => s.id === id)!, r = C.of(id)
  const beat = M.D.story?.find(b => b.scene === id)
  const cam = C.o(`${id}.camera`), tr = C.o(`${id}.transition`)
  return (
    <div className="flex flex-col gap-4 text-[13.5px] leading-snug">
      {beat && <div className="rounded-[10px] bg-sky/10 p-3"><div className="label text-sky">{beat.beat}</div><p className="mt-0.5 text-[15px] font-semibold">“{beat.viewer}”</p><p className="mt-0.5 text-[12px] text-muted">What the viewer should think here.</p></div>}
      <dl className="grid gap-3 sm:grid-cols-2">
        <Fact k="Purpose" v={sc.purpose} />
        <Fact k="Timing" v={`${tc(r.start)} to ${tc(r.end)} · ${(r.end - r.start).toFixed(1)} s at this pace`} />
        <Fact k="Camera" v={`${optLabel(cam)}${cam?.why ? `: ${cleanText(cam.why)}` : ''}`} />
        <Fact k="How it begins" v={`${optLabel(tr) || 'Opens the film'}${tr?.why ? `: ${cleanText(tr.why)}` : ''}`} />
        <Fact k="Truth" v={TRUTH[sc.truth || 'real_ui'] || sc.truth || 'Real'} />
        <Fact k="Text on screen" v={`${sc.levels || 1} level${(sc.levels || 1) > 1 ? 's' : ''}${sc.copy ? `: ${sc.copy}` : ''}`} />
      </dl>
      {sc.notes && <div><div className="label mb-1.5">Director's comments</div><dl className="flex flex-col gap-2">{Object.entries(sc.notes).map(([k, v]) => <div key={k} className="grid grid-cols-[90px_1fr] gap-2"><dt className="font-semibold capitalize text-muted">{k}</dt><dd>{v}</dd></div>)}</dl></div>}
    </div>
  )
}

function Sound({ id }: { id: string }) {
  const M = useStudio(s => s.M)!
  const C = useStudio(s => s.C)!
  const r = C.of(id)
  const vo = C.vo().find(v => v.r.sc.id === id)
  const d = M.DEC[`${id}.vo`]
  const voice = C.o('voice'), music = C.o('music')
  const sfx = C.sfx().filter(s => s.r.sc.id === id && s.j === 0)
  return (
    <div className="flex flex-col gap-4 text-[13.5px]">
      <section>
        <div className="label mb-1.5">Narration · {voice ? `${voice.name} (${voice.accent})` : 'Sarah'}</div>
        {d?.options.map(o => {
          const k = `${id}-${o.id}`, on = vo?.o.id === o.id
          const src = o.needs || o.origin === 'ai' || (voice?.needs && !voice.dir) ? null : voice?.dir ? `${voice.dir}${k}.mp3` : o.src
          const text = voice?.texts?.[k] || o.text
          return (
            <div key={o.id} className={cx('mb-1.5 flex items-center gap-2 rounded-[10px] border px-3 py-2', on ? 'border-sky bg-sky/10' : 'border-line')}>
              <span className="mono text-[11px] font-bold text-dim">{o.id}</span>
              <Mic size={13} className="text-sky" />
              <span className="flex-1 italic">“{cleanText(text)}”{voice?.texts?.[k] && <span className="block text-[12px] not-italic text-dim">{cleanText(o.text)}</span>}</span>
              {src ? <Preview src={src} dur={3} /> : <span className="tag tag-amber text-[10.5px]">not recorded</span>}
            </div>
          )
        })}
      </section>
      <section>
        <div className="label mb-1.5">Sound effects in this shot</div>
        {!sfx.length && <p className="text-muted">None. Silence lets the picture and voice carry it.</p>}
        <ul className="flex flex-col gap-1.5">
          {sfx.map(s => { const ms = beatOffsetMs(C, s.key); return (
            <li key={s.key} className="flex items-center gap-2 rounded-[10px] border border-line px-3 py-2">
              <span className="mono w-[64px] text-[12px] text-muted">+{(s.a - r.start).toFixed(2)} s</span>
              <span className="min-w-0 flex-1"><b>{s.x.label}</b><span className="block truncate text-[12px] text-dim">{optLabel(s.o)}{ms != null ? ` · ${Math.abs(ms) <= 15 ? 'on the beat' : `${ms > 0 ? '+' : ''}${ms} ms from the beat`}` : ''}</span></span>
              {s.o?.src && <Preview src={s.o.src} gain={s.o.gain} dur={2} />}
            </li>) })}
        </ul>
      </section>
      <section><div className="label mb-1.5">Music under this shot</div><p>{optLabel(music)}{music?.bpm ? ` · ${Math.round(music.bpm)} BPM` : ''}{music?.lic ? ` · ${music.lic}` : ''}</p></section>
    </div>
  )
}

function Notes({ id }: { id: string }) {
  const notes = useStudio(s => s.notes)
  const C = useStudio(s => s.C)!
  const [text, setText] = useState('')
  const mine = notes.map((n, i) => ({ n, num: i + 1 })).filter(x => x.n.scene === id)
  const r = C.of(id)
  return (
    <div className="flex flex-col gap-3 text-[13.5px]">
      <form className="flex flex-col gap-1.5" onSubmit={async e => { e.preventDefault(); if (!text.trim()) return; await addNote({ kind: 'shot', a: r.start, b: r.end, target: `Shot ${r.i + 1}: ${r.sc.name}`, scene: id, strokes: [], quick: [], category: 'story' }, text.trim()); setText('') }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2} className="field resize-none" placeholder="A comment about this whole shot: its idea, length or order" aria-label="Comment on this shot" onKeyDown={e => e.stopPropagation()} />
        <button type="submit" className="btn btn-ember btn-sm self-end" disabled={!text.trim()}>Save comment</button>
      </form>
      {!mine.length ? <p className="text-muted">No comments on this shot yet.</p> : (
        <ol className="flex flex-col gap-2">{mine.map(({ n, num }) => (
          <li key={n.id} className="card p-2.5"><div className="flex items-baseline gap-2"><span className="grid h-5 min-w-5 place-items-center rounded-full bg-ember px-1 text-[11px] font-extrabold text-ember-ink">{num}</span><b className="truncate">{n.target}</b><span className="mono ml-auto text-[11.5px] text-dim">{tc(n.t)}</span></div><p className="mt-1 text-muted">{n.text}</p></li>
        ))}</ol>
      )}
    </div>
  )
}

function Fact({ k, v }: { k: string; v: string }) { return <div><dt className="label">{k}</dt><dd className="mt-0.5">{v}</dd></div> }
