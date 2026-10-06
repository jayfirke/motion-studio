import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BadgeCheck, Check, Columns2, MessageSquarePlus, Pause, Play, RotateCcw, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Tip } from '../ui'
import { setView, ui, useStudio } from '../../state/store'
import { playback } from '../../engine/playback'
import { momentOf, optLabel } from '../../data/model'
import { Stage } from './Stage'
import { Controls } from './Controls'
import { Timeline } from './Timeline'
import { refs } from './refs'
import { cx, store as ls } from '../../lib/util'

/** The screening room: frame, transport and timeline. Fills the whole screen in full-screen mode. */
export function Player() {
  const full = useStudio(s => s.full)
  const playing = useStudio(s => s.playing)
  const mode = useStudio(s => s.mode)
  const draft = useStudio(s => s.draft)
  const compare = useStudio(s => s.compare)
  const el = useRef<HTMLDivElement>(null)
  const [idle, setIdle] = useState(false)
  const timer = useRef(0)

  useEffect(() => { refs.player = el.current })
  const wake = () => {
    if (idle) setIdle(false)
    window.clearTimeout(timer.current)
    if (full) timer.current = window.setTimeout(() => setIdle(true), 2600)
  }
  useEffect(() => { if (!playing || !full) setIdle(false) }, [playing, full])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const hide = full && idle && playing && !draft && mode === 'watch'

  return (
    <div ref={el} className={cx('flex min-h-0 flex-col bg-theater', full ? 'force-dark fixed inset-0 z-[60]' : 'relative h-full')} onPointerMove={wake} style={{ cursor: hide ? 'none' : undefined }} data-testid="player">
      {compare && <CompareBar />}
      {!compare && !full && <WhatsNew />}
      <div className={cx('relative min-h-0 flex-1', full && 'pb-[96px]')} onClick={e => { if (mode === 'watch' && !compare && (e.target as HTMLElement).closest('[data-testid="screen"]')) playback.toggle() }} data-tour="frame">
        <Stage />
        <BigPlay />
        <EndCard />
        {mode === 'comment' && !draft && <ModeHint />}
      </div>
      {full ? (
        <div className={cx('absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10 transition-opacity duration-300', hide && 'pointer-events-none opacity-0')}>
          <div className="px-3"><Timeline compact /></div>
          <Controls overlay />
        </div>
      ) : (
        <>
          <Controls />
          <Timeline />
        </>
      )}
    </div>
  )
}

/** After the last frame: the obvious next steps, so nobody is left wondering what to do. */
function EndCard() {
  const playing = useStudio(s => s.playing)
  const atEnd = useStudio(s => (s.C ? s.T >= s.C.total - 0.05 : false))
  const mode = useStudio(s => s.mode), compare = useStudio(s => s.compare), draft = useStudio(s => s.draft)
  const approved = useStudio(s => !!s.approval?.approved && s.approval.version === (s.M?.D.versions?.slice(-1)[0]?.v || 'v0.1'))
  const open = useStudio(s => s.notes.filter(n => n.status !== 'done').length)
  if (playing || !atEnd || mode !== 'watch' || compare || draft) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-3" data-testid="endcard">
      <div className="pop pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 p-2.5 pl-4" onClick={e => e.stopPropagation()}>
        <span className="mr-1 text-[13.5px]"><b>That's the whole film.</b> <span className="text-muted">{approved ? 'Approved; Claude builds it next.' : open ? `${open} open note${open > 1 ? 's' : ''}.` : 'Anything to change?'}</span></span>
        <button type="button" className="btn btn-sm" onClick={() => playback.play(0)}><RotateCcw size={14} />Watch again</button>
        <button type="button" className="btn btn-sm" onClick={() => { const C = ui.get().C!; const r = C.TL[C.TL.length - 1]; playback.seek(r.start + (r.sc.key ?? 0) * r.k); ui.set({ mode: 'comment' }) }}><MessageSquarePlus size={14} />Leave a note</button>
        {!approved && <button type="button" className="btn btn-sm btn-go" onClick={() => ui.set({ overlay: 'approve' })}><BadgeCheck size={14} />Approve</button>}
      </div>
    </div>
  )
}

/** One line when the film changed since you last looked, with a link to what changed. */
function WhatsNew() {
  const M = useStudio(s => s.M)
  const film = useStudio(s => s.film?.id)
  const nNotes = useStudio(s => s.notes.length)
  const changed = useStudio(s => (s.M ? s.M.ORDER.some(k => s.picks[k] !== s.M!.DIRECTOR[k]) : false))
  const [hide, setHide] = useState(false)
  const vs = M?.D.versions || [], ver = vs[vs.length - 1]
  const seenKey = `studio2:${film}:seen`, seen = ls.get<string>(seenKey)
  // Only people who saw an earlier version need "what changed"; a first visit just records the version.
  const returning = seen != null ? seen !== ver?.v : nNotes > 0 || changed
  useEffect(() => { if (ver && seen == null && !returning) ls.set(seenKey, ver.v) }, [ver, seen, returning, seenKey])
  if (!M || !film || hide || !ver || vs.length < 2 || !returning) return null
  const changes = (M.D.changes || []).filter(c => c.v === ver.v)
  const done = () => { ls.set(seenKey, ver.v); setHide(true) }
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-sky/10 px-3 py-2 text-[13px]" data-testid="whatsnew">
      <Sparkles size={15} className="text-sky" />
      <span className="min-w-0 flex-1"><b>{ver.v}</b> <span className="text-muted">{ver.note}{changes.length ? ` (${changes.length} change${changes.length > 1 ? 's' : ''})` : ''}</span></span>
      {changes.length > 0 && <button type="button" className="btn btn-sm" onClick={() => { done(); setView('plan'); requestAnimationFrame(() => document.getElementById('plan-versions')?.scrollIntoView({ block: 'start' })) }}>See changes</button>}
      <button type="button" className="icon-btn icon-btn-sm" aria-label="Dismiss" onClick={done}><X size={15} /></button>
    </div>
  )
}

function BigPlay() {
  const playing = useStudio(s => s.playing)
  const mode = useStudio(s => s.mode)
  const compare = useStudio(s => s.compare)
  const atEnd = useStudio(s => (s.C ? s.T >= s.C.total - 0.05 : false))
  const [seen, setSeen] = useState(false)
  useEffect(() => { if (playing) setSeen(true) }, [playing])
  if (seen || playing || atEnd || mode !== 'watch' || compare) return null
  return (
    <button type="button" onClick={e => { e.stopPropagation(); playback.play() }} aria-label="Play the film"
      className="absolute left-1/2 top-1/2 z-10 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-[#111] shadow-[0_10px_40px_rgba(0,0,0,.5)] transition-transform hover:scale-105" data-testid="bigplay">
      <Play size={34} fill="currentColor" className="ml-1" />
    </button>
  )
}

/** How comment mode works. Sits beside the frame when there is room; otherwise a pill that fades after a few seconds. */
function ModeHint() {
  const tool = useStudio(s => s.tool)
  const [fade, setFade] = useState(false)
  const [room, setRoom] = useState(false)
  useEffect(() => { setFade(false); const id = setTimeout(() => setFade(true), 5000); return () => clearTimeout(id) }, [tool])
  useLayoutEffect(() => {
    const upd = () => { const s = refs.screen?.getBoundingClientRect(), f = refs.frame?.getBoundingClientRect(); setRoom(!!s && !!f && f.left - s.left > 250) }
    upd(); addEventListener('resize', upd); return () => removeEventListener('resize', upd)
  }, [])
  const lines = tool === 'pen' ? ['Draw on the frame.', 'Let go to write the note.'] : tool === 'arrow' ? ['Drag an arrow', 'from where it is to where it should go.'] : ['Click any part to comment on it.', 'Drag a box to cover several parts.', 'Scroll to pick a smaller or bigger part.']
  if (room) return (
    <div className="pointer-events-none absolute left-5 top-5 z-[6] flex max-w-[220px] flex-col gap-1.5 rounded-[12px] border border-ember/40 bg-ember/10 p-3 text-[12.5px] leading-snug text-fg">
      <b className="text-ember">Comment mode</b>
      {lines.map(l => <span key={l} className="text-muted">{l}</span>)}
      <span className="text-dim">Esc to stop.</span>
    </div>
  )
  return (
    <div className={cx('pointer-events-none absolute inset-x-0 bottom-3 z-[6] flex justify-center px-3 transition-opacity duration-500', fade && 'opacity-0')}>
      <div className="max-w-[520px] rounded-full bg-ember px-4 py-1.5 text-center text-[12.5px] font-semibold text-ember-ink shadow-lg">{lines.join(' ')}</div>
    </div>
  )
}

function CompareBar() {
  const c = useStudio(s => s.compare!)
  const d = useStudio(s => s.M!.DEC[c.key])
  const playing = useStudio(s => s.playing)
  const toggle = (id: string) => {
    const on = c.ids.includes(id)
    if (on && c.ids.length <= 2) return
    if (!on && c.ids.length >= 4) { toast('Compare shows up to four at once'); return }
    const ids = on ? c.ids.filter(x => x !== id) : [...c.ids, id]
    ui.set({ compare: { ...c, ids, hear: Math.min(c.hear, ids.length - 1) } })
  }
  const playLoop = () => { const { M, C, T } = ui.get(); if (!M || !C) return; const [a, b] = momentOf(M, C, c.key, C.at(T)); playback.play(a, b, true) }
  return (
    <div className="z-10 flex flex-wrap items-center gap-2 border-b border-line bg-panel px-3 py-2 text-[13px]" data-testid="compare-bar">
      <Columns2 size={16} className="text-sky" />
      <b className="mr-1">{d.q}</b>
      <span className="hidden text-muted sm:inline">Showing</span>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Options in the comparison">
        {d.options.map(o => (
          <Tip key={o.id} title={`${o.id} · ${optLabel(o)}`} desc={c.ids.includes(o.id) ? 'Click to take it out of the comparison' : 'Click to add it to the comparison (up to four)'}>
            <button type="button" aria-pressed={c.ids.includes(o.id)} onClick={() => toggle(o.id)} className={cx('h-7 min-w-7 rounded-[7px] border px-2 text-[12px] font-bold', c.ids.includes(o.id) ? 'border-sky bg-sky text-sky-ink' : 'border-line2 text-muted hover:text-fg')}>{o.id}</button>
          </Tip>
        ))}
      </div>
      <span className="flex-1" />
      <span className="hidden text-[12px] text-dim lg:inline">Click a frame to hear it · Use picks it</span>
      <button type="button" className="btn btn-sm" onClick={() => (playing ? playback.pause() : playLoop())}>{playing ? <><Pause size={13} />Pause</> : <><Play size={13} />Play on loop</>}</button>
      <button type="button" className="btn btn-sm btn-primary" onClick={() => { ui.set({ compare: null }); playback.pause() }}><Check size={13} />Done</button>
    </div>
  )
}
