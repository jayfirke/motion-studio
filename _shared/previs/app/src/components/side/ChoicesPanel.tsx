import * as Slider from '@radix-ui/react-slider'
import { Film, Clapperboard, RotateCcw, SlidersHorizontal, ArrowDownToLine } from 'lucide-react'
import { useState } from 'react'
import { resetPicks, setMix, setTweak, useStudio } from '../../state/store'
import { ChoiceCard } from '../choices/ChoiceCard'
import { playback } from '../../engine/playback'
import { beatOffsetMs } from '../../data/model'
import { Tip } from '../ui'
import { cx, plural, store as ls } from '../../lib/util'
import type { Lane } from '../../engine/audio'

type Scope = 'film' | 'shot' | 'mix'

/** Every decision, three options each. The shot section follows the playhead. */
export function ChoicesPanel() {
  const M = useStudio(s => s.M)!
  const [scope, setScope] = useState<Scope>(() => ls.get<Scope>('studio2:scope') || 'shot')
  const changed = useStudio(s => s.M ? s.M.ORDER.filter(k => s.picks[k] !== s.M!.DIRECTOR[k]).length : 0)
  const go = (s: Scope) => { setScope(s); ls.set('studio2:scope', s) }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-4 pb-3 pt-1">
        <div className="seg flex-1" role="group" aria-label="Which choices">
          <Tip title="This shot" desc="Choices for the shot under the playhead. Changes as the film plays."><button type="button" aria-pressed={scope === 'shot'} onClick={() => go('shot')} className="flex-1 justify-center"><Clapperboard size={14} />Shot</button></Tip>
          <Tip title="Whole film" desc="Look, music, motion feel and pace: they change every shot at once."><button type="button" aria-pressed={scope === 'film'} onClick={() => go('film')} className="flex-1 justify-center"><Film size={14} />Film</button></Tip>
          <Tip title="Sound mix" desc="Volume of voice, music and sounds, and the music dip under the voice."><button type="button" aria-pressed={scope === 'mix'} onClick={() => go('mix')} className="flex-1 justify-center"><SlidersHorizontal size={14} />Mix</button></Tip>
        </div>
      </div>
      {changed > 0 && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-[10px] bg-sky/10 px-3 py-2 text-[12.5px] text-sky">
          <span className="flex-1"><b>{plural(changed, 'choice')}</b> changed from the director's picks.</span>
          <button type="button" className="btn btn-ghost btn-sm text-sky" onClick={() => resetPicks()}><RotateCcw size={13} />Reset all</button>
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-testid="choices">
        {scope === 'film' && <div className="flex flex-col gap-3">{['direction', 'music', 'voice', 'motion', 'pacing'].filter(k => M.DEC[k]).map(k => <ChoiceCard key={k} k={k} />)}</div>}
        {scope === 'shot' && <ShotChoices />}
        {scope === 'mix' && <MixPanel />}
      </div>
    </div>
  )
}

function ShotChoices() {
  const M = useStudio(s => s.M)!
  const idx = useStudio(s => s.C ? s.C.at(s.T).i : 0)
  const C = useStudio(s => s.C)!
  const sc = M.D.scenes[idx]
  const keys = M.ORDER.filter(k => M.DEC[k].scene === sc.id)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Shots">
        {M.D.scenes.map((s, i) => (
          <Tip key={s.id} title={`Shot ${i + 1}: ${s.name}`} desc={s.purpose}>
            <button type="button" role="tab" aria-selected={i === idx} onClick={() => { const r = C.TL[i]; playback.seek(r.start + (s.key ?? 0) * r.k) }}
              className={cx('h-8 min-w-8 rounded-[8px] border px-2 text-[12.5px] font-bold', i === idx ? 'border-sky bg-sky text-sky-ink' : 'border-line text-muted hover:border-line2 hover:text-fg')}>{i + 1}</button>
          </Tip>
        ))}
      </div>
      <div className="px-0.5">
        <div className="label">Shot {idx + 1} of {M.D.scenes.length}</div>
        <h3 className="text-[17px] font-bold leading-tight">{sc.name}</h3>
        <p className="mt-1 text-[13px] leading-snug text-muted">{sc.purpose}</p>
      </div>
      {keys.map(k => <ChoiceCard key={k} k={k} />)}
      {!keys.length && <p className="text-[13px] text-muted">This shot has no choices of its own.</p>}
    </div>
  )
}

function MixPanel() {
  const mix = useStudio(s => s.mix)
  const C = useStudio(s => s.C)!
  const lanes: { id: Lane; name: string; desc: string }[] = [
    { id: 'vo', name: 'Voice', desc: "Sarah's lines. The voice leads the mix." },
    { id: 'music', name: 'Music', desc: 'The background track.' },
    { id: 'sfx', name: 'Sounds', desc: 'Clicks, paper, whooshes and the logo hit.' },
  ]
  const hits = C.sfx().filter(s => s.x.hit && s.j === 0)
  return (
    <div className="flex flex-col gap-3">
      <section className="card flex flex-col gap-4 p-3.5">
        <div>
          <h4 className="text-[14.5px] font-bold">Volume</h4>
          <p className="mt-0.5 text-[12.5px] text-muted">Changes here go into the approved spec. Solo and mute on the timeline are only for listening.</p>
        </div>
        {lanes.map(l => {
          const db = mix.db[l.id] || 0
          return (
            <div key={l.id} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between"><Tip title={l.name} desc={l.desc}><span className="text-[13.5px] font-semibold">{l.name}</span></Tip><span className={cx('mono text-[12px]', db ? 'text-sky' : 'text-dim')}>{db > 0 ? '+' : ''}{db.toFixed(1)} dB</span></div>
              <Slider.Root className="relative flex h-5 touch-none select-none items-center" min={-12} max={12} step={1.5} value={[db]} onValueCommit={([v]) => setTweak(`lane.${l.id}`, { db: v }, `${l.name} volume`)} onValueChange={([v]) => setMix({ db: { ...mix.db, [l.id]: v } })} aria-label={`${l.name} volume`}>
                <Slider.Track className="relative h-1.5 grow rounded-full bg-raise"><Slider.Range className="absolute h-full rounded-full bg-sky" /></Slider.Track>
                <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-sky bg-fg shadow focus-visible:outline-2" />
              </Slider.Root>
            </div>
          )
        })}
      </section>
      <section className="card flex items-start gap-3 p-3.5">
        <ArrowDownToLine size={18} className="mt-0.5 text-amber" />
        <div className="flex-1">
          <h4 className="text-[14.5px] font-bold">Dip the music under the voice</h4>
          <p className="mt-0.5 text-[12.5px] text-muted">The music gets about 8 dB quieter while Sarah speaks, so every word is clear.</p>
        </div>
        <button type="button" role="switch" aria-checked={mix.duck} aria-label="Dip the music under the voice" onClick={() => setTweak('mix.duck', { on: !mix.duck }, mix.duck ? 'Music stays level' : 'Music dips under voice')}
          className={cx('relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors', mix.duck ? 'bg-mint' : 'bg-raise')}>
          <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform', mix.duck ? 'translate-x-[22px]' : 'translate-x-0.5')} />
        </button>
      </section>
      {hits.length > 0 && (
        <section className="card p-3.5">
          <h4 className="text-[14.5px] font-bold">Hits on the beat</h4>
          <p className="mt-0.5 text-[12.5px] text-muted">Key sounds should land within 40 ms of a music beat.</p>
          <ul className="mt-2 flex flex-col gap-1">
            {hits.map(h => { const ms = beatOffsetMs(C, h.key) ?? 0; const ok = Math.abs(ms) <= 40; return (
              <li key={h.key}><button type="button" onClick={() => playback.play(Math.max(0, h.a - 1), Math.min(C.total, h.a + 1))} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[13px] hover:bg-raise">
                <span className={cx('h-2 w-2 rounded-full', ok ? 'bg-mint' : 'bg-amber')} /><span className="flex-1 truncate">{h.x.label}</span><span className="mono text-[11.5px] text-muted">{Math.abs(ms) <= 15 ? 'on beat' : `${ms > 0 ? '+' : ''}${ms} ms`}</span>
              </button></li>) })}
          </ul>
        </section>
      )}
    </div>
  )
}
