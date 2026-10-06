import { useLayoutEffect, useRef, useState } from 'react'
import { ArrowUpRight, MousePointer2, PenLine, Send, Trash2, X } from 'lucide-react'
import { addNote, ui, useStudio, type Draft } from '../../state/store'
import { CATS } from '../side/NotesPanel'
import { optLabel } from '../../data/model'
import type { NoteCategory } from '../../data/types'
import { refs } from './refs'
import { IconBtn, Kbd } from '../ui'
import { usePhone } from '../../lib/hooks'
import { clamp, cx, tc } from '../../lib/util'

const QUICK: Record<string, string[]> = {
  frame: ['Make it bigger', 'Make it smaller', 'Move it', 'Change the colour', 'Hard to read', 'Love this'],
  region: ['Too busy here', 'Needs more space', 'Change this area', 'Hard to read', 'Love this'],
  range: ['Too slow', 'Too fast', 'Cut this part', 'Confusing', 'Love this part'],
  sound: ['Louder', 'Quieter', 'Earlier', 'Later', 'Different sound', 'Remove it'],
  shot: ['Change the idea', 'Shorter', 'Longer', 'Swap the order', 'Love this shot'],
  revert: [],
}

/** The note box. Opens next to what you pointed at (a bottom sheet on phones). Enter saves, Esc closes. */
export function Composer() {
  const draft = useStudio(s => s.draft)
  if (!draft) return null
  return <ComposerBox key={`${draft.kind}:${draft.a}:${draft.target}`} draft={draft} />
}

function ComposerBox({ draft }: { draft: Draft }) {
  const tool = useStudio(s => s.tool)
  const phone = usePhone()
  const box = useRef<HTMLDivElement>(null)
  const ta = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState('')
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const drawable = draft.kind === 'frame' || draft.kind === 'region'
  const M = useStudio(s => s.M)
  const C = useStudio(s => s.C)
  const cat = draft.category || guessCategory(draft)
  const scene = draft.scene || C?.at(draft.a).sc.id
  // Decisions a "prefer" link can point at: this shot's choices, then the whole-film ones.
  const prefKeys = M ? M.ORDER.filter(k => M.DEC[k].scene === scene || !M.DEC[k].scene) : []
  const patch = (p: Partial<Draft>) => ui.set({ draft: { ...draft, ...p } })
  const shot = C && draft.kind !== 'range' ? C.at(draft.a) : null

  useLayoutEffect(() => {
    if (phone) { setPos(null); return }
    const el = box.current; if (!el) return
    const w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight
    let ax: number, ay: number
    if (draft.anchor) { ax = draft.anchor.x; ay = draft.anchor.y }
    else {
      const fr = refs.frame?.getBoundingClientRect()
      if (!fr) { setPos({ left: vw / 2 - w / 2, top: vh / 2 - h / 2 }); return }
      ax = fr.left + (draft.x ?? 0.5) * fr.width; ay = fr.top + (draft.y ?? 0.5) * fr.height
      const right = fr.right + 14, left = fr.left - w - 14
      if (right + w < vw - 8) ax = right; else if (left > 8) ax = left; else ax = ax + 18
      setPos({ left: clamp(ax, 8, vw - w - 8), top: clamp(ay - 24, 8, vh - h - 8) }); return
    }
    setPos({ left: clamp(ax - w / 2, 8, vw - w - 8), top: ay - h - 12 > 8 ? ay - h - 12 : clamp(ay + 14, 8, vh - h - 8) })
  }, [draft, phone])

  useLayoutEffect(() => { ta.current?.focus({ preventScroll: true }) }, [])

  const close = () => ui.set({ draft: null, tool: 'point' })
  const toggle = (q: string) => ui.set({ draft: { ...draft, quick: draft.quick.includes(q) ? draft.quick.filter(x => x !== q) : [...draft.quick, q] } })
  const can = text.trim().length > 0 || draft.quick.length > 0
  const save = async () => { if (!can) { ta.current?.focus(); return } await addNote({ ...draft, category: cat }, text.trim()); close() }
  const when = draft.b != null ? `${tc(draft.a)} to ${tc(draft.b)}` : tc(draft.a)

  return (
    <>
      {phone && <div className="scrim" onClick={close} />}
      <div ref={box} role="dialog" aria-label="Add a comment" data-testid="composer"
        className={cx('pop fixed z-[95] flex flex-col gap-3 p-4', phone ? 'inset-x-0 bottom-0 rounded-b-none pb-[max(16px,env(safe-area-inset-bottom))]' : 'w-[340px]')}
        style={phone ? undefined : { left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
        onKeyDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="label">Comment on</div>
            <div className="truncate text-[15px] font-bold" title={draft.target}>{draft.target}</div>
            <div className="mono mt-0.5 text-[12px] text-muted">{when}{shot ? ` · shot ${shot.i + 1} ${shot.sc.name}` : ''}{draft.kind === 'region' && draft.targets && draft.targets.length > 1 ? ` · ${draft.targets.length} parts` : ''}</div>
          </div>
          <IconBtn small label="Close" desc="Discard this comment" keys={['Esc']} onClick={close}><X size={16} /></IconBtn>
        </div>
        {QUICK[draft.kind]?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {QUICK[draft.kind].map(q => (
              <button key={q} type="button" onClick={() => toggle(q)} aria-pressed={draft.quick.includes(q)}
                className={cx('rounded-full border px-2.5 py-1 text-[12.5px] font-semibold transition-colors', draft.quick.includes(q) ? 'border-ember bg-ember text-ember-ink' : 'border-line2 text-muted hover:border-dim hover:text-fg')}>{q}</button>
            ))}
          </div>
        )}
        <div className="flex flex-col gap-1.5" data-testid="note-meta">
          <div className="flex flex-wrap gap-1" role="group" aria-label="What is this comment about">
            {(Object.keys(CATS) as NoteCategory[]).map(c => <button key={c} type="button" aria-pressed={cat === c} onClick={() => patch({ category: c })} className={cx('rounded-full px-2 py-0.5 text-[11.5px] font-semibold', cat === c ? 'bg-fg text-ink' : 'bg-raise text-muted hover:text-fg')}>{CATS[c]}</button>)}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="seg !p-0.5" role="group" aria-label="How important">
              <button type="button" className="!min-h-[26px] !px-2 text-[11.5px]" aria-pressed={(draft.priority || 'must') === 'must'} onClick={() => patch({ priority: 'must' })}>Must change</button>
              <button type="button" className="!min-h-[26px] !px-2 text-[11.5px]" aria-pressed={draft.priority === 'nice'} onClick={() => patch({ priority: 'nice' })}>Nice to have</button>
            </div>
            <div className="seg !p-0.5" role="group" aria-label="Change or question">
              <button type="button" className="!min-h-[26px] !px-2 text-[11.5px]" aria-pressed={(draft.intent || 'change') === 'change'} onClick={() => patch({ intent: 'change' })}>Change</button>
              <button type="button" className="!min-h-[26px] !px-2 text-[11.5px]" aria-pressed={draft.intent === 'question'} onClick={() => patch({ intent: 'question' })}>Question</button>
            </div>
          </div>
          {M && prefKeys.length > 0 && (
            <select className="field !py-1 text-[12.5px]" aria-label="Prefer an option" value={draft.prefer ? `${draft.prefer.key}|${draft.prefer.id}` : ''} onChange={e => { const [k, id] = e.target.value.split('|'); patch({ prefer: e.target.value ? { key: k, id } : null }) }}>
              <option value="">Point to an option you prefer (optional)</option>
              {prefKeys.map(k => <optgroup key={k} label={M.DEC[k].q}>{M.DEC[k].options.map(o => <option key={o.id} value={`${k}|${o.id}`}>{o.id} · {optLabel(o)}</option>)}</optgroup>)}
            </select>
          )}
        </div>
        <textarea ref={ta} rows={phone ? 2 : 3} value={text} onChange={e => setText(e.target.value)} className="field resize-none text-[14px]"
          placeholder="What should change? Plain words are fine." aria-label="Your comment"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); save() } if (e.key === 'Escape') close() }} />
        <div className="flex items-center gap-1">
          {drawable && (
            <>
              <IconBtn small label="Point" desc="Click a part to comment it, or drag a box around several" on={tool === 'point'} onClick={() => ui.set({ tool: 'point' })}><MousePointer2 size={15} /></IconBtn>
              <IconBtn small label="Draw" desc="Draw freehand on the frame to show what you mean" keys={['P']} on={tool === 'pen'} onClick={() => ui.set({ tool: 'pen' })}><PenLine size={15} /></IconBtn>
              <IconBtn small label="Arrow" desc="Drag an arrow to show where something should go" keys={['A']} on={tool === 'arrow'} onClick={() => ui.set({ tool: 'arrow' })}><ArrowUpRight size={15} /></IconBtn>
              {draft.strokes.length > 0 && <IconBtn small label="Clear drawing" desc="Remove the lines you drew" onClick={() => ui.set({ draft: { ...draft, strokes: [] } })}><Trash2 size={15} /></IconBtn>}
            </>
          )}
          <span className="flex-1" />
          {!phone && <span className="mr-1 hidden items-center gap-1 text-[11.5px] text-dim sm:flex"><Kbd>Enter</Kbd> save</span>}
          <button type="button" className="btn btn-ember btn-sm" disabled={!can} onClick={save} data-testid="save-note"><Send size={14} />Save comment</button>
        </div>
      </div>
    </>
  )
}

/** A first guess at what a note is about, from what was pointed at. */
function guessCategory(d: Draft): NoteCategory {
  const t = `${d.target} ${(d.targets || []).join(' ')} ${d.key || ''}`.toLowerCase()
  if (d.kind === 'sound') return /voice|line|vo\b|\.vo/.test(t) ? 'voice' : 'sound'
  if (d.kind === 'range' || d.kind === 'shot') return 'story'
  if (/headline|tagline|“|text|title|caption/.test(t)) return 'copy'
  return 'look'
}
