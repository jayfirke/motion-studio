import * as DM from '@radix-ui/react-dropdown-menu'
import { ArrowUpRight, ChevronLeft, ChevronRight, Ellipsis, Maximize, MessageSquarePlus, Minimize, MousePointer2, PanelRight, Pause, PenLine, Play, Repeat, SkipBack, SkipForward, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { setHold, setMix, ui, useStudio } from '../../state/store'
import { playback } from '../../engine/playback'
import { IconBtn, Tip } from '../ui'
import { usePhone } from '../../lib/hooks'
import { cx, tc } from '../../lib/util'
import { useMemo } from 'react'

export const RATES = [0.5, 0.75, 1, 1.25, 1.5]

export function toggleFull() {
  const s = ui.get()
  if (s.full) {
    ui.set({ full: false })
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
  } else {
    ui.set({ full: true, drawer: false })
    const el = document.documentElement
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => { /* theater mode still fills the window */ })
  }
}
export function toggleComment() {
  const s = ui.get()
  if (s.mode === 'comment') ui.set({ mode: 'watch', draft: null, tool: 'point' })
  else { playback.pause(); ui.set({ mode: 'comment', compare: null }) }
}
export function stepShot(dir: 1 | -1) {
  const { C, T } = ui.get(); if (!C) return
  const cur = C.at(T)
  if (dir < 0 && T - cur.start > 0.6) { playback.seek(cur.start); return }
  const r = C.TL[Math.max(0, Math.min(C.TL.length - 1, cur.i + dir))]
  playback.seek(r.start)
}
export function stepNote(dir: 1 | -1) {
  const { notes, T } = ui.get()
  const list = [...notes].sort((a, b) => a.t - b.t)
  if (!list.length) return
  const n = dir > 0 ? list.find(x => x.t > T + 0.05) || list[0] : [...list].reverse().find(x => x.t < T - 0.05) || list[list.length - 1]
  playback.seek(n.t); ui.set({ selNote: n.id })
}

/** Transport and review tools under the frame. */
export function Controls({ overlay }: { overlay?: boolean }) {
  const playing = useStudio(s => s.playing)
  const T = useStudio(s => s.T)
  const C = useStudio(s => s.C)
  const mode = useStudio(s => s.mode)
  const tool = useStudio(s => s.tool)
  const full = useStudio(s => s.full)
  const rate = useStudio(s => s.rate)
  const loop = useStudio(s => s.loop)
  const mix = useStudio(s => s.mix)
  const hold = useStudio(s => s.hold)
  const nNotes = useStudio(s => s.notes.length)
  const wideDock = !overlay
  const phone = usePhone()
  const changed = useStudio(s => s.M ? s.M.ORDER.some(k => s.picks[k] !== s.M!.DIRECTOR[k]) : false)
  const cur = C ? C.at(T) : null
  const total = C?.total || 0
  const setRate = (r: number) => { ui.set({ rate: r }); playback.restart(true) }

  const more = useMemo(() => (
    <DM.Root>
      <DM.Trigger asChild>
        <button type="button" className="icon-btn" aria-label="More playback options"><Ellipsis size={18} /></button>
      </DM.Trigger>
      <DM.Portal>
        <DM.Content className="pop z-[100] min-w-[220px] p-1.5" sideOffset={8} align="end">
          <DM.Label className="label px-2 py-1">Speed</DM.Label>
          {RATES.map(r => <DM.Item key={r} onSelect={() => setRate(r)} className="flex cursor-pointer items-center rounded-md px-2 py-1.5 text-[13.5px] outline-none data-[highlighted]:bg-raise">{r === 1 ? 'Normal' : `${r}×`}{rate === r && <span className="ml-auto text-sky">●</span>}</DM.Item>)}
          <DM.Separator className="my-1 h-px bg-line" />
          <DM.Item onSelect={() => ui.set({ loop: !loop })} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13.5px] outline-none data-[highlighted]:bg-raise"><Repeat size={14} />Loop{loop && <span className="ml-auto text-sky">On</span>}</DM.Item>
          <DM.Item onSelect={() => setMix({ muted: !mix.muted })} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13.5px] outline-none data-[highlighted]:bg-raise">{mix.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}{mix.muted ? 'Unmute' : 'Mute'}</DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  ), [rate, loop, mix.muted])

  if (!C || !cur) return null
  return (
    <div className={cx('flex items-center gap-1 px-2 sm:gap-1.5 sm:px-3', overlay ? 'h-[52px] text-white' : 'h-[54px] border-t border-line bg-panel')} data-testid="controls">
      <IconBtn label={playing ? 'Pause' : 'Play'} desc={playing ? 'Stop at this frame' : 'Play the film with sound'} keys={['Space']} onClick={() => playback.toggle()} className="h-11 w-11 bg-fg text-ink hover:!bg-fg hover:opacity-90" data-testid="play">
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
      </IconBtn>
      {!phone && <IconBtn label="Previous shot" desc="Jump to the start of this or the previous shot" keys={['[']} onClick={() => stepShot(-1)}><SkipBack size={17} /></IconBtn>}
      {!phone && <IconBtn label="Next shot" desc="Jump to the next shot" keys={[']']} onClick={() => stepShot(1)}><SkipForward size={17} /></IconBtn>}
      <div className="ml-1 flex min-w-0 flex-col leading-tight">
        <span className="mono text-[13px]"><span className="text-fg">{tc(T)}</span><span className="text-dim"> / {tc(total)}</span></span>
        <span className="truncate text-[11.5px] font-semibold text-muted">Shot {cur.i + 1} · {cur.sc.name}{rate !== 1 ? ` · ${rate}×` : ''}{loop ? ' · loop' : ''}</span>
      </div>
      <span className="flex-1" />
      <Tip title={mode === 'comment' ? 'Stop commenting' : 'Comment'} desc={mode === 'comment' ? 'Back to watching. Your notes are saved.' : 'Pause and point at anything on the frame: click a part, drag a box around several, or draw.'} keys={['C']}>
        <button type="button" onClick={toggleComment} aria-pressed={mode === 'comment'} data-testid="comment-toggle" data-tour="comment"
          className={cx('btn', mode === 'comment' ? 'btn-ember' : overlay ? 'border-white/20 bg-white/10 text-white hover:!bg-white/20' : '', phone && 'px-2.5')}>
          <MessageSquarePlus size={16} />{!phone && (mode === 'comment' ? 'Commenting' : 'Comment')}
        </button>
      </Tip>
      {mode === 'comment' && !phone && (
        <div className={cx('seg ml-0.5', overlay && 'border-white/15 bg-black/40')} role="group" aria-label="Comment tool">
          <Tip title="Point" desc="Click a part to note it. Drag to box several parts. Scroll to pick a smaller or bigger part."><button type="button" aria-pressed={tool === 'point'} onClick={() => ui.set({ tool: 'point' })} aria-label="Point"><MousePointer2 size={14} /></button></Tip>
          <Tip title="Draw" desc="Draw freehand on the frame" keys={['P']}><button type="button" aria-pressed={tool === 'pen'} onClick={() => ui.set({ tool: 'pen' })} aria-label="Draw"><PenLine size={14} /></button></Tip>
          <Tip title="Arrow" desc="Drag an arrow to show where something should go" keys={['A']}><button type="button" aria-pressed={tool === 'arrow'} onClick={() => ui.set({ tool: 'arrow' })} aria-label="Arrow"><ArrowUpRight size={14} /></button></Tip>
        </div>
      )}
      {nNotes > 0 && !phone && (
        <>
          <IconBtn label="Previous note" desc="Jump to the note before the playhead" keys={['⇧', 'N']} onClick={() => stepNote(-1)}><ChevronLeft size={18} /></IconBtn>
          <IconBtn label="Next note" desc="Jump to the next note on the timeline" keys={['N']} onClick={() => stepNote(1)}><ChevronRight size={18} /></IconBtn>
        </>
      )}
      {changed && !phone && (
        <Tip title="Hold to hear the original" desc="While you hold this (or the \ key), the film plays with the director's recommended picks. Let go to return to yours." keys={['\\']}>
          <button type="button" aria-pressed={hold} onPointerDown={() => setHold(true)} onPointerUp={() => setHold(false)} onPointerLeave={() => setHold(false)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setHold(true) } }} onKeyUp={() => setHold(false)}
            className={cx('btn btn-sm', hold ? 'btn-ember' : overlay ? 'border-white/20 bg-white/10 text-white' : '')}><Sparkles size={13} />{hold ? 'Original' : 'Hold: original'}</button>
        </Tip>
      )}
      {wideDock && !phone && (
        <Tip title="Speed" desc="Play slower to check details, faster to feel the rhythm">
          <span className="seg hidden md:inline-flex">
            {[0.5, 1, 1.5].map(r => <button key={r} type="button" aria-pressed={rate === r} onClick={() => setRate(r)} className="!px-2 mono text-[12px]">{r}×</button>)}
          </span>
        </Tip>
      )}
      {!phone && <IconBtn label={loop ? 'Loop is on' : 'Loop'} desc="Play the same part again and again" on={loop} onClick={() => ui.set({ loop: !loop })}><Repeat size={17} /></IconBtn>}
      {!phone && <IconBtn label={mix.muted ? 'Unmute' : 'Mute'} desc="Turn all sound off or on" keys={['M']} onClick={() => setMix({ muted: !mix.muted })}>{mix.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</IconBtn>}
      {phone && more}
      <IconBtn label={full ? 'Exit full screen' : 'Full screen'} desc={full ? 'Back to the studio' : 'Watch and review on the whole screen'} keys={['F']} onClick={toggleFull} data-testid="fullscreen">{full ? <Minimize size={18} /> : <Maximize size={18} />}</IconBtn>
      {full && <IconBtn label="Choices and notes" desc="Open the panel on the side without leaving full screen" onClick={() => ui.set({ drawer: !ui.get().drawer })}><PanelRight size={18} /></IconBtn>}
    </div>
  )
}
