import { useEffect, useState } from 'react'
import { Bot, Check, ChevronDown, Columns2, Library, Magnet, Mic, Minus, Pause, Play, Plus, RotateCcw, Sparkles, X } from 'lucide-react'
import { removeOption, setPick, setTweak, resetPicks, ui, useStudio } from '../../state/store'
import { beatOffsetMs, cleanText, libraryKind, momentOf, optLabel, type Dec } from '../../data/model'
import type { Option } from '../../data/types'
import { audio } from '../../engine/audio'
import { playback } from '../../engine/playback'
import { IconBtn, Tip } from '../ui'
import { Curve } from './Curve'
import { cx } from '../../lib/util'

const VISUAL = new Set(['direction', 'motion', 'camera', 'transition', 'pacing'])
const SWATCH = ['bg', 'card', 'accent', 'on-bg']
const ORIGIN: Record<string, [string, string]> = { library: ['Added', 'tag-sky'], ai: ['AI', 'tag-sky'], you: ['Yours', 'tag-sky'] }

/** Plays the moment that shows a decision, right in the main player. */
export function tryMoment(key: string) {
  const { M, C } = ui.get(); if (!M || !C) return
  const [a, b] = momentOf(M, C, key, C.at(ui.get().T))
  if (ui.get().view !== 'watch') return
  playback.play(a, b)
}

/** Opens side-by-side compare for a decision: the current pick plus up to three others. */
export function openCompare(key: string, ids?: string[]) {
  const { M, picks } = ui.get(); if (!M) return
  const d = M.DEC[key]; if (!d) return
  const list = ids && ids.length >= 2 ? ids : [picks[key], ...d.options.map(o => o.id).filter(id => id !== picks[key])].slice(0, 3)
  ui.set({ compare: { key, ids: list.slice(0, 4), hear: 0 }, view: 'watch', mode: 'watch', draft: null })
  // Motion, pace, camera and transitions only differ while things move: loop the moment so the difference shows.
  const { C } = ui.get(); if (!C) return
  const [a, b] = momentOf(M, C, key, C.at(ui.get().T))
  requestAnimationFrame(() => playback.play(a, b, true))
}

/** One decision with its options. Picking an option changes the film and plays that moment at once. */
export function ChoiceCard({ k, dense, onPicked }: { k: string; dense?: boolean; onPicked?: () => void }) {
  const d = useStudio(s => s.M?.DEC[k]) as Dec | undefined
  const pick = useStudio(s => s.picks[k])
  const hold = useStudio(s => s.hold)
  const replay = useStudio(s => s.prefs.replay)
  const libSize = useStudio(s => { const dd = s.M?.DEC[k]; const kind = dd && libraryKind(dd); return kind ? (s.M?.D.libraries?.[kind] || []).length : 0 })
  const [all, setAll] = useState(false)
  if (!d) return null
  const changed = pick !== d.chosen
  const pickIt = (o: Option) => {
    if (pick !== o.id) setPick(k, o.id)
    audio.stopPreview()
    // On a phone the panel covers the film: slide it down while the change plays.
    if (replay && ui.get().drawer && matchMedia('(max-width: 639px)').matches && ui.get().view === 'watch') ui.set({ peek: true })
    onPicked?.()
    if (replay) requestAnimationFrame(() => tryMoment(k))
  }
  // Show the director's three and the current pick; the rest fold away.
  const shown = all ? d.options : d.options.filter((o, i) => i < 3 || o.id === pick)
  const hidden = d.options.length - shown.length
  const canMore = libSize > 0 || d.kind === 'direction' || d.kind === 'motion' || d.kind === 'vo'
  return (
    <section className={cx('flex flex-col gap-2', !dense && 'card p-3.5')} data-choice={k}>
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-[14.5px] font-bold leading-snug">{d.q}{d.options.length > 3 && <span className="ml-1.5 align-middle text-[11.5px] font-semibold text-dim">{d.options.length} options</span>}</h4>
          {!dense && d.help && <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{d.help}</p>}
        </div>
        {changed && (
          <Tip title="Back to the recommendation" desc={`Use the director's pick again: ${optLabel(d.options.find(o => o.id === d.chosen))}`}>
            <button type="button" className="btn btn-ghost btn-sm -mr-1.5 -mt-1 text-muted" onClick={() => { resetPicks([k]); if (replay) requestAnimationFrame(() => tryMoment(k)) }}><RotateCcw size={13} />Reset</button>
          </Tip>
        )}
      </header>
      <div role="radiogroup" aria-label={d.q} className="flex flex-col gap-1.5">
        {shown.map(o => <OptionRow key={o.id} k={k} d={d} o={o} on={pick === o.id} held={hold} onPick={() => pickIt(o)} />)}
      </div>
      {hidden > 0 && <button type="button" className="btn btn-ghost btn-sm self-start text-muted" onClick={() => setAll(true)}><ChevronDown size={13} />Show {hidden} more</button>}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {!dense && (VISUAL.has(d.kind) || d.kind === 'vo' || d.kind === 'music' || d.kind === 'voice') && (
          <Tip title="Watch it again" desc="Plays the moment this choice changes, with sound">
            <button type="button" className="btn btn-sm" onClick={() => tryMoment(k)}><Play size={13} />Play this moment</button>
          </Tip>
        )}
        {(VISUAL.has(d.kind) || d.kind === 'music' || d.kind === 'voice') && d.options.length > 1 && (
          <Tip title="Compare side by side" desc={`Shows your pick and up to three other options next to each other, playing in sync${d.kind === 'motion' || d.kind === 'pacing' ? ' on a loop, so the difference in movement is visible' : ''}. Click a frame to hear it.`}>
            <button type="button" className="btn btn-sm" onClick={() => openCompare(k)}><Columns2 size={13} />Compare</button>
          </Tip>
        )}
        {canMore && (
          <Tip title="More options" desc={d.kind === 'vo' ? 'Ask the director for new wordings of this line; Claude Code records them.' : `Browse ${libSize ? `${libSize} more in the library` : 'new options'}, or describe what you want ("simple and sober") and the director adds it.`}>
            <button type="button" className="btn btn-sm btn-ghost text-sky" onClick={() => ui.set({ library: k })} data-testid={`more-${k}`}><Library size={13} />More options</button>
          </Tip>
        )}
      </div>
      {d.kind === 'sfx' && <SfxTweaks k={k} />}
    </section>
  )
}

function OptionRow({ k, d, o, on, held, onPick }: { k: string; d: Dec; o: Option; on: boolean; held: boolean; onPick: () => void }) {
  const rec = o.id === d.chosen
  const name = optLabel(o)
  const added = o.origin && o.origin !== 'director' ? ORIGIN[o.origin] : null
  const sub = d.kind === 'music' ? [o.bpm ? `${Math.round(o.bpm)} BPM` : 'no steady beat', o.lic?.split('·')[0], o.level ? `${o.level} energy` : ''].filter(Boolean).join(' · ')
    : d.kind === 'vo' ? (o.needs ? 'needs a recording' : `${(o.dur || 0).toFixed(1)} s`)
    : d.kind === 'voice' ? [o.accent, o.gender].filter(Boolean).join(' · ') : ''
  const preview = d.kind === 'voice' ? o.sample : o.src
  return (
    <div className={cx('group relative flex items-stretch rounded-[10px] border transition-colors', on ? 'border-sky bg-sky/10' : 'border-line hover:border-line2 hover:bg-raise/60', held && !rec && 'opacity-60')}>
      <button type="button" role="radio" aria-checked={on} onClick={onPick} className="flex min-w-0 flex-1 items-start gap-2.5 px-3 py-2 text-left" data-option={o.id}>
        <span className={cx('mt-[2px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2', on ? 'border-sky bg-sky text-sky-ink' : 'border-line2')}>{on && <Check size={11} strokeWidth={3.5} />}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="mono text-[11px] font-bold text-dim">{o.id}</span>
            <span className={cx('text-[13.5px] font-semibold leading-snug', d.kind === 'vo' && 'italic')}>{d.kind === 'vo' ? `“${name}”` : name}</span>
            {rec && <span className="tag tag-mint px-1.5 py-0 text-[10.5px]"><Sparkles size={10} />Recommended</span>}
            {added && <span className={cx('tag px-1.5 py-0 text-[10.5px]', added[1])}>{o.origin === 'ai' ? <Bot size={10} /> : null}{added[0]}</span>}
            {o.needs && <span className="tag tag-amber px-1.5 py-0 text-[10.5px]"><Mic size={10} />Claude Code records it</span>}
          </span>
          {d.kind === 'direction' && o.tokens && (
            <span className="mt-1.5 flex items-center gap-1">
              {SWATCH.map(t => o.tokens![t] && <span key={t} className="h-3.5 w-5 rounded-[4px] border border-line2" style={{ background: o.tokens![t] }} />)}
              <span className="ml-1 truncate text-[11.5px] text-dim">{(o.tokens.display || '').split(',')[0].replace(/'/g, '')}</span>
            </span>
          )}
          {sub && <span className="mono mt-0.5 block text-[11px] text-dim">{sub}</span>}
          {(o.why || o.pitch || o.intro) && <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-muted">{cleanText(o.pitch || o.intro || o.why)}</span>}
        </span>
        {d.kind === 'motion' && <Curve o={o} className="mt-1 shrink-0 text-sky" />}
      </button>
      <div className="flex flex-col items-center justify-center gap-0.5 pr-1">
        {preview && <Preview src={preview} gain={o.gain} dur={d.kind === 'voice' ? 3 : o.dur} />}
        {added && <IconBtn small label="Remove this option" desc="Takes this added option off the list (undo brings it back)" onClick={e => { e.stopPropagation(); removeOption(k, o.id) }}><X size={13} /></IconBtn>}
      </div>
    </div>
  )
}

/** Hear just this option on its own (no picture). */
export function Preview({ src, gain = 1, dur }: { src: string; gain?: number; dur?: number }) {
  const [on, setOn] = useState(false)
  useEffect(() => { if (!on) return; const id = setTimeout(() => setOn(false), Math.min(12000, (dur || 6) * 1000 + 300)); return () => clearTimeout(id) }, [on, dur])
  return (
    <IconBtn small label={on ? 'Stop' : 'Listen'} desc="Hear this option on its own, without changing your pick"
      onClick={e => { e.stopPropagation(); if (on) { audio.stopPreview(); setOn(false) } else { playback.pause(); audio.previewSrc(src, gain); setOn(true) } }}>
      {on ? <Pause size={14} /> : <Play size={14} />}
    </IconBtn>
  )
}

/** Timing and volume nudges for one sound effect, with a snap to the nearest beat. */
export function SfxTweaks({ k }: { k: string }) {
  const tw = useStudio(s => s.tweaks[k]) || {}
  const C = useStudio(s => s.C)
  const fps = useStudio(s => s.M?.D.project.fps || 30)
  if (!C) return null
  const ms = beatOffsetMs(C, k)
  const dt = tw.dt || 0, db = tw.db || 0
  const nudge = (p: { dt?: number; db?: number }, label: string) => { setTweak(k, p, label); requestAnimationFrame(() => tryMoment(k)) }
  const snap = () => { if (ms == null) return; nudge({ dt: +(dt - ms / 1000).toFixed(3) }, 'Snap to beat') }
  const off = ms == null ? '' : Math.abs(ms) <= 15 ? 'on the beat' : `${Math.abs(ms)} ms ${ms > 0 ? 'late' : 'early'}`
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-[10px] bg-ink/60 px-2.5 py-2">
      <div className="flex items-center gap-1">
        <span className="label mr-1">Timing</span>
        <IconBtn small label="Earlier" desc="Move this sound one frame earlier" onClick={() => nudge({ dt: +(dt - 1 / fps).toFixed(3) }, 'Sound earlier')}><Minus size={13} /></IconBtn>
        <span className="mono w-[58px] text-center text-[12px]">{dt === 0 ? '0 ms' : `${dt > 0 ? '+' : ''}${Math.round(dt * 1000)} ms`}</span>
        <IconBtn small label="Later" desc="Move this sound one frame later" onClick={() => nudge({ dt: +(dt + 1 / fps).toFixed(3) }, 'Sound later')}><Plus size={13} /></IconBtn>
        {ms != null && (
          <Tip title="Snap to the beat" desc={`Lines this sound up with the nearest music beat. Now: ${off}.`}>
            <button type="button" className={cx('btn btn-sm ml-1', Math.abs(ms) <= 15 && 'text-mint')} onClick={snap} disabled={Math.abs(ms) <= 15}><Magnet size={13} />{Math.abs(ms) <= 15 ? 'On beat' : off}</button>
          </Tip>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="label mr-1">Volume</span>
        <IconBtn small label="Quieter" desc="Lower this sound by 1.5 dB" onClick={() => nudge({ db: Math.max(-18, db - 1.5) }, 'Sound quieter')}><Minus size={13} /></IconBtn>
        <span className="mono w-[52px] text-center text-[12px]">{db > 0 ? '+' : ''}{db.toFixed(1)} dB</span>
        <IconBtn small label="Louder" desc="Raise this sound by 1.5 dB" onClick={() => nudge({ db: Math.min(9, db + 1.5) }, 'Sound louder')}><Plus size={13} /></IconBtn>
      </div>
    </div>
  )
}
