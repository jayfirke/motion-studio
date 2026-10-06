import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, CheckCircle2, ListChecks, MessageSquarePlus, Play } from 'lucide-react'
import { ui, useStudio } from '../../state/store'
import type { Model } from '../../data/model'
import { playback } from '../../engine/playback'
import { ChoiceCard } from '../choices/ChoiceCard'
import { toggleComment } from '../player/Controls'
import { Tip } from '../ui'
import { cx } from '../../lib/util'

export interface Step { id: string; title: string; body: string; keys: string[]; scene?: string; play?: 'all' | 'shot'; final?: boolean }

export function buildSteps(M: Model): Step[] {
  const S: Step[] = [{ id: 'watch', title: 'Watch it once', body: 'Play the whole film with sound. Do not judge the details yet. Does the story make sense in one go?', keys: [], play: 'all' }]
  if (M.DEC.direction) S.push({ id: 'look', title: 'Pick the look', body: 'Colours, type and surfaces. Each option repaints every shot. Click one and the frame changes right away.', keys: ['direction'] })
  if (M.DEC.voice) S.push({ id: 'voice', title: 'Pick the voice', body: 'Who narrates, and in which language. Press the play button on a voice to hear its intro line; ask the director for more voices.', keys: ['voice'] })
  if (M.DEC.music) S.push({ id: 'music', title: 'Pick the music', body: 'Click an option to hear it under the film from the start. The beats it brings set where the hits land.', keys: ['music'] })
  const feel = ['motion', 'pacing'].filter(k => M.DEC[k])
  if (feel.length) S.push({ id: 'feel', title: 'Motion and pace', body: 'How things move and how long each shot lasts. Faster pacing makes the whole film shorter.', keys: feel })
  M.D.scenes.forEach((sc, i) => S.push({ id: sc.id, title: `Shot ${i + 1}: ${sc.name}`, body: sc.purpose, keys: M.ORDER.filter(k => M.DEC[k].scene === sc.id), scene: sc.id, play: 'shot' }))
  S.push({ id: 'again', title: 'Watch it again', body: 'Play the whole film with your picks. Anything still off? Press Comment and click it, or drag across the timeline to mark a stretch of time.', keys: [], play: 'all' })
  S.push({ id: 'approve', title: 'Approve', body: 'When it feels right, approve this version. Claude freezes your picks into the production spec and builds the real video.', keys: [], final: true })
  return S
}

/** A short, guided path through every decision, ending in approval. */
export function StepsPanel() {
  const M = useStudio(s => s.M)!
  const step = useStudio(s => s.step)
  const approval = useStudio(s => s.approval)
  const steps = useMemo(() => buildSteps(M), [M])
  const go = (i: number) => {
    const s = steps[i]; ui.set({ step: i })
    const C = ui.get().C!
    if (s?.scene) { const r = C.of(s.scene); playback.seek(r.start + (r.sc.key ?? 0) * r.k) }
    else if (ui.get().T < 0.3 || s?.play === 'all') { const r = C.TL[0]; playback.seek(r.start + (r.sc.key ?? 0) * r.k) }
  }
  if (step < 0) return (
    <div className="flex flex-col gap-4 px-4 pb-6 pt-2">
      <div className="card flex flex-col gap-3 p-4">
        <ListChecks size={26} className="text-sky" />
        <h3 className="text-[18px] font-bold leading-tight">Review in {steps.length} short steps</h3>
        <p className="text-[13.5px] leading-snug text-muted">One decision at a time, with the film playing right beside you. About five minutes. You can leave a note at any step and come back later.</p>
        <button type="button" className="btn btn-primary self-start" onClick={() => go(0)} data-testid="start-steps">Start the review<ArrowRight size={15} /></button>
      </div>
      <StepList steps={steps} cur={-1} go={go} />
    </div>
  )
  const s = steps[Math.min(step, steps.length - 1)]
  const C = ui.get().C!
  const playIt = () => { if (s.scene) { const r = C.of(s.scene); playback.play(r.start, r.end) } else playback.play(0) }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center justify-between text-[12px] text-muted"><span>Step {step + 1} of {steps.length}</span><button type="button" className="font-semibold text-sky hover:underline" onClick={() => ui.set({ step: -1 })}>All steps</button></div>
        <div className="mt-1.5 flex gap-[3px]" aria-hidden>{steps.map((x, i) => <button key={x.id} type="button" tabIndex={-1} onClick={() => go(i)} className={cx('h-1.5 flex-1 rounded-full', i < step ? 'bg-sky/60' : i === step ? 'bg-sky' : 'bg-raise')} title={x.title} />)}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-testid="steps">
        <h3 className="text-[19px] font-bold leading-tight">{s.title}</h3>
        <p className="mt-1.5 text-[13.5px] leading-snug text-muted">{s.body}</p>
        {s.play && <button type="button" className="btn btn-sm mt-3" onClick={playIt}><Play size={13} />{s.play === 'all' ? 'Play the film' : 'Play this shot'}</button>}
        {s.keys.length > 0 && <div className="mt-4 flex flex-col gap-3">{s.keys.map(k => <ChoiceCard key={k} k={k} />)}</div>}
        {s.final && (
          <div className="mt-4 flex flex-col gap-2">
            {approval?.approved ? <p className="flex items-center gap-2 text-[13.5px] text-mint"><CheckCircle2 size={16} />Approved {approval.version}.</p> : null}
            <button type="button" className="btn btn-go self-start" onClick={() => ui.set({ overlay: 'approve' })}><BadgeCheck size={16} />{approval?.approved ? 'Review the approval' : 'Approve this version'}</button>
          </div>
        )}
        <button type="button" className="btn btn-ghost btn-sm mt-4 text-muted" onClick={() => { if (ui.get().mode !== 'comment') toggleComment() }}><MessageSquarePlus size={14} />Something else? Leave a note</button>
      </div>
      <div className="flex items-center gap-2 border-t border-line px-4 py-3">
        <Tip title="Back" desc="The previous step"><button type="button" className="btn" disabled={step === 0} onClick={() => go(step - 1)}><ArrowLeft size={15} /></button></Tip>
        {step < steps.length - 1
          ? <button type="button" className="btn btn-primary flex-1" onClick={() => go(step + 1)} data-testid="next-step">Next: {steps[step + 1].title}<ArrowRight size={15} /></button>
          : <button type="button" className="btn btn-go flex-1" onClick={() => ui.set({ overlay: 'approve' })}><BadgeCheck size={16} />Approve</button>}
      </div>
    </div>
  )
}

function StepList({ steps, cur, go }: { steps: Step[]; cur: number; go: (i: number) => void }) {
  return (
    <ol className="flex flex-col">
      {steps.map((s, i) => (
        <li key={s.id}><button type="button" onClick={() => go(i)} className={cx('flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left hover:bg-raise', cur === i && 'bg-raise')}>
          <span className="mono grid h-6 w-6 place-items-center rounded-full border border-line2 text-[11px] text-muted">{i + 1}</span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{s.title}</span>
          {s.keys.length > 0 && <span className="text-[11.5px] text-dim">{s.keys.length} choice{s.keys.length === 1 ? '' : 's'}</span>}
        </button></li>
      ))}
    </ol>
  )
}
