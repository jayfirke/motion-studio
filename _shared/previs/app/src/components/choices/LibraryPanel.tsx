import * as Dialog from '@radix-ui/react-dialog'
import { useMemo, useRef, useState } from 'react'
import { Bot, Check, Loader2, Plus, Send, Sparkles, Wand2, X } from 'lucide-react'
import { toast } from 'sonner'
import { addRequest, setPick, ui, useStudio } from '../../state/store'
import { cleanText, libraryKind, optLabel } from '../../data/model'
import type { Option } from '../../data/types'
import { addFromLibrary, runDirector } from '../../lib/director'
import { rank } from '../../lib/match'
import { Preview, tryMoment } from './ChoiceCard'
import { Curve } from './Curve'
import { usePhone } from '../../lib/hooks'
import { cx } from '../../lib/util'

const SWATCH = ['bg', 'card', 'accent', 'on-bg']
const PROMPTS: Record<string, string[]> = {
  direction: ['simple and sober', 'warm and premium', 'bold and playful', 'calm blue, trustworthy'],
  music: ['simple and sober', 'warm acoustic', 'upbeat and fun', 'cinematic'],
  motion: ['calm and smooth', 'snappy modern', 'a little bouncy', 'slow and cinematic'],
  voice: ['calm female', 'deep male', 'Hindi', 'Indian English'],
  pacing: ['faster', 'more relaxed'],
  camera: ['steady', 'reveal'],
  transition: ['smooth carry', 'fast'],
  sfx: ['softer click', 'paper', 'whoosh'],
  vo: ['shorter', 'funnier', 'more premium'],
}

/** "More options" for one decision: the library, a plain-words search, and the AI director. */
export function LibraryPanel() {
  const key = useStudio(s => s.library)
  const phone = usePhone()
  if (!key) return null
  return (
    <Dialog.Root open onOpenChange={o => { if (!o) ui.set({ library: null }) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="scrim !z-[100] !bg-black/30" />
        <Dialog.Content aria-describedby={undefined} onKeyDown={e => e.stopPropagation()}
          className={cx('fixed z-[101] flex flex-col bg-panel shadow-2xl outline-none', phone ? 'inset-x-0 bottom-0 h-[86vh] rounded-t-[18px] border-t border-line2' : 'bottom-0 right-0 top-0 w-[min(480px,96vw)] border-l border-line2')}
          style={{ animation: 'popIn .16s ease-out' }} data-testid="library">
          <Body k={key} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Body({ k }: { k: string }) {
  const M = useStudio(s => s.M)!
  const pick = useStudio(s => s.picks[k])
  const d = M.DEC[k]
  const kind = d ? (libraryKind(d) || d.kind) : ''
  const lib = useMemo(() => (kind && M.D.libraries?.[kind]) || [], [M, kind])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [said, setSaid] = useState<string | null>(null)
  const [req, setReq] = useState('')
  const input = useRef<HTMLInputElement>(null)
  if (!d) return null
  const added = new Map(d.options.filter(o => o.ref).map(o => [o.ref!, o.id]))
  const list = q.trim() ? rank(q, lib).filter(r => r.score > 0).map(r => ({ o: r.o, hits: r.hits })) : lib.map(o => ({ o, hits: [] as string[] }))
  const tags = [...new Set(lib.flatMap(o => o.tags || []))].filter(t => !['female', 'male', 'en', 'hi', 'foley', 'library'].includes(t)).slice(0, 14)
  const generative = d.kind === 'direction' || d.kind === 'motion' || d.kind === 'vo'
  const ask = async (text: string) => {
    if (!text.trim() || busy) return
    setBusy(true); setSaid(null)
    try {
      const wish = d.kind === 'vo' ? `Write 3 new wordings for the ${d.scene} narration line, ${text}. Keep each under 3 words a second.` : `${d.q} I want ${text}. Add 2 or 3 fitting options${generative ? ' (design new ones if the library has nothing close)' : ''} and switch to the best one.`
      const r = await runDirector(wish, [], k, undefined, undefined, text)
      setSaid([r.reply, ...r.done.map(x => `• ${x.label}`)].join('\n'))
    } catch { setSaid('The director could not answer just now.') }
    finally { setBusy(false) }
  }
  return (
    <>
      <div className="flex items-start gap-2 border-b border-line px-4 pb-3 pt-4">
        <div className="min-w-0 flex-1">
          <div className="label">More options</div>
          <Dialog.Title className="text-[17px] font-bold leading-tight">{d.q}{d.scene ? <span className="font-normal text-muted"> · shot {M.D.scenes.findIndex(s => s.id === d.scene) + 1}</span> : null}</Dialog.Title>
          <p className="mt-0.5 text-[12.5px] text-muted">{d.options.length} options now{lib.length ? ` · ${lib.length} in the library` : ''}. Added options stay with the film and go into the approved spec.</p>
        </div>
        <Dialog.Close className="icon-btn icon-btn-sm" aria-label="Close"><X size={17} /></Dialog.Close>
      </div>
      <div className="flex flex-col gap-2 px-4 pt-3">
        <form className="flex gap-1.5" onSubmit={e => { e.preventDefault(); ask(q) }}>
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} className="field text-[14px]" autoFocus placeholder={d.kind === 'vo' ? 'How should the new line feel?' : 'Describe it: "simple and sober"'} aria-label="Describe what you want" />
          <button type="submit" className="btn btn-sky shrink-0" disabled={!q.trim() || busy} data-testid="ask-director-lib">{busy ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}Ask</button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {(PROMPTS[d.kind] || []).map(p => <button key={p} type="button" className="rounded-full border border-line2 px-2.5 py-1 text-[12px] font-semibold text-muted hover:border-dim hover:text-fg" onClick={() => { setQ(p); input.current?.focus() }}>{p}</button>)}
          {tags.slice(0, q ? 0 : 8).map(t => <button key={t} type="button" className="rounded-full bg-raise px-2.5 py-1 text-[12px] font-semibold text-muted hover:text-fg" onClick={() => setQ(t)}>#{t}</button>)}
        </div>
        <p className="text-[12px] text-dim">Typing filters the library instantly. <b className="text-muted">Ask</b> lets the director choose{generative ? ' or design new ones' : ''} and switch to the best.</p>
        {said && <div className="whitespace-pre-wrap rounded-[10px] bg-sky/10 px-3 py-2 text-[13px] leading-snug"><span className="mb-1 flex items-center gap-1.5 font-bold text-sky"><Bot size={14} />Director</span>{said}</div>}
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-testid="library-list">
        {d.kind === 'vo' ? (
          <p className="py-6 text-center text-[13px] text-muted">New wordings are written by the director and recorded by Claude Code. Describe the feel above and press Ask.</p>
        ) : !list.length ? (
          <p className="py-6 text-center text-[13px] text-muted">{lib.length ? <>Nothing in the library matches “{q}”. Press <b>Ask</b> and the director will {generative ? 'design one' : 'file it for Claude Code'}.</> : 'This choice has no library. Ask the director or Claude Code below.'}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {list.map(({ o, hits }) => <LibItem key={o.id} k={k} kind={d.kind} o={o} hits={hits} added={added.get(o.id)} current={pick} />)}
          </ul>
        )}
      </div>
      <form className="flex gap-1.5 border-t border-line px-4 py-3" onSubmit={e => { e.preventDefault(); if (!req.trim()) return; addRequest(`${d.q}${d.scene ? ` (${d.scene})` : ''}: ${req.trim()}`, d.scene || undefined); setReq(''); toast.success('Filed for Claude Code', { description: 'It appears in Notes; send your notes to Claude Code when ready.' }) }}>
        <input value={req} onChange={e => setReq(e.target.value)} className="field text-[13px]" placeholder="Not here? Ask Claude Code for it" aria-label="Request for Claude Code" />
        <button type="submit" className="btn shrink-0" disabled={!req.trim()}><Send size={14} />File</button>
      </form>
    </>
  )
}

function LibItem({ k, kind, o, hits, added, current }: { k: string; kind: string; o: Option; hits: string[]; added?: string; current: string }) {
  const add = (pickIt: boolean) => {
    const id = addFromLibrary(k, o, pickIt)
    if (id && pickIt) requestAnimationFrame(() => tryMoment(k))
    toast.success(`${pickIt ? 'Using' : 'Added'} ${o.name}`, { description: pickIt ? 'Playing that moment now.' : `It is option ${id} on the card.` })
  }
  const using = !!added && added === current
  return (
    <li className={cx('rounded-[12px] border p-3', using ? 'border-sky bg-sky/10' : 'border-line')} data-lib={o.id}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <b className="text-[14px]">{optLabel(o)}</b>
            {o.accent && <span className="tag px-1.5 py-0 text-[10.5px]">{o.accent} · {o.gender}</span>}
            {o.bpm !== undefined && kind === 'music' && <span className="mono text-[11px] text-dim">{o.bpm ? `${Math.round(o.bpm)} BPM` : 'free tempo'}{o.level ? ` · ${o.level}` : ''}</span>}
            {added && <span className="tag tag-sky px-1.5 py-0 text-[10.5px]"><Check size={10} />Option {added}</span>}
          </div>
          {kind === 'direction' && o.tokens && <div className="mt-1.5 flex items-center gap-1">{SWATCH.map(t => o.tokens![t] && <span key={t} className="h-4 w-6 rounded-[4px] border border-line2" style={{ background: o.tokens![t] }} />)}<span className="ml-1 text-[11.5px] text-dim">{(o.tokens.display || '').split(',')[0].replace(/'/g, '')}</span></div>}
          <p className="mt-1 text-[12.5px] leading-snug text-muted">{cleanText(o.pitch || o.intro || o.why)}</p>
          {o.tradeoff && <p className="mt-0.5 text-[12px] leading-snug text-dim">Trade-off: {o.tradeoff}</p>}
          {!!o.tags?.length && <div className="mt-1.5 flex flex-wrap gap-1">{o.tags.slice(0, 7).map(t => <span key={t} className={cx('rounded-full px-1.5 text-[11px]', hits.includes(t) ? 'bg-sky/15 text-sky' : 'bg-raise text-dim')}>{t}</span>)}</div>}
        </div>
        {kind === 'motion' && <Curve o={o} w={64} h={36} className="shrink-0 text-sky" />}
        {(o.src || o.sample) && <Preview src={(kind === 'voice' ? o.sample : o.src)!} gain={o.gain} dur={kind === 'voice' ? 3 : 10} />}
      </div>
      <div className="mt-2 flex gap-1.5">
        {added ? (
          <button type="button" className="btn btn-sm" disabled={using} onClick={() => { setPick(k, added); requestAnimationFrame(() => tryMoment(k)) }}><Sparkles size={13} />{using ? 'In use' : 'Use it'}</button>
        ) : (
          <>
            <button type="button" className="btn btn-sm btn-sky" onClick={() => add(true)} data-testid="lib-use"><Sparkles size={13} />Add and use</button>
            <button type="button" className="btn btn-sm" onClick={() => add(false)}><Plus size={13} />Add</button>
          </>
        )}
      </div>
    </li>
  )
}
