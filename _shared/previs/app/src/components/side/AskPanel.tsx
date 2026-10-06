import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Bot, Columns2, Plus, Send, Sparkles, Square, Undo2 } from 'lucide-react'
import { getSample } from '../../lib/claude'
import { undo, useStudio } from '../../state/store'
import { runDirector, type Done, type Turn } from '../../lib/director'
import { cx } from '../../lib/util'

interface Msg extends Turn { done?: Done[]; ai?: boolean }

const SUGGEST = [
  'Give me more colour options',
  'Music that is simple and sober',
  'Which voices and languages do you have?',
  'Make the whole film feel more premium',
  'Show me calmer motion options',
  'Use a Hindi narrator',
]

/** Ask the director: questions get answers, wishes get done (options added, picks switched, jobs filed for Claude Code). */
export function AskPanel() {
  const [ai, setAi] = useState<boolean | null>(null)
  const [turns, setTurns] = useState<Msg[]>([])
  const [busy, setBusy] = useState(false)
  const [live, setLive] = useState('')
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const ctl = useRef<AbortController | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const film = useStudio(s => s.film?.id)

  useEffect(() => { let on = true; getSample().then(s => { if (on) setAi(!!s) }); return () => { on = false } }, [])
  useEffect(() => { setTurns([]); setLive(''); setErr('') }, [film])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [turns, live])

  const ask = async (q: string) => {
    if (!q.trim() || busy) return
    const history = turns.map(({ role, content }) => ({ role, content }))
    setTurns(t => [...t, { role: 'user', content: q.trim() }]); setText(''); setBusy(true); setLive(''); setErr('')
    ctl.current = new AbortController()
    try {
      const r = await runDirector(q.trim(), history, undefined, ctl.current.signal, t => { const m = t.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)/); if (m) setLive(m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"')) })
      setTurns(t => [...t, { role: 'assistant', content: r.reply, done: r.done, ai: r.ai }])
      if (r.errors.length && !r.done.length) setErr(r.errors[0])
    } catch (e) {
      if ((e as { code?: string })?.code !== 'cancelled') setErr('The director could not answer just now. Try again in a moment.')
    } finally { setBusy(false); setLive(''); ctl.current = null }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3" data-testid="ask">
        {!turns.length && (
          <div className="flex flex-col gap-3 pt-1">
            <div className="card flex gap-3 p-3.5">
              <Bot size={20} className="mt-0.5 shrink-0 text-sky" />
              <div className="text-[13.5px] leading-snug text-muted">
                <p>Ask anything about the film, or ask for a change. The director <b className="text-fg">does it</b>: adds more looks, music, motion feels and voices, switches choices, compares options, or files a job for Claude Code when it needs new recordings or files.</p>
                <p className="mt-1.5 text-[12.5px] text-dim">{ai ? 'Answers use your Claude plan.' : ai === false ? 'Claude is not reachable from this page, so the director works from the option libraries without AI.' : 'Connecting…'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">{SUGGEST.map(s => <button key={s} type="button" className="rounded-full border border-line2 px-3 py-1.5 text-[12.5px] font-semibold text-muted hover:border-dim hover:text-fg" onClick={() => ask(s)}>{s}</button>)}</div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {turns.map((t, i) => (
            <div key={i} className={cx('max-w-[94%] rounded-[12px] px-3 py-2 text-[13.5px] leading-snug', t.role === 'user' ? 'self-end bg-sky text-sky-ink' : 'self-start bg-raise')}>
              {t.role === 'assistant' && <span className="mb-1 flex items-center gap-1.5 text-[12px] font-bold text-sky"><Bot size={13} />Director{t.ai === false && <span className="font-normal text-dim">· from the libraries</span>}</span>}
              <p className="whitespace-pre-wrap">{t.content}</p>
              {!!t.done?.length && (
                <div className="mt-2 flex flex-col gap-1 border-t border-line pt-2">
                  {t.done.map((a, j) => <span key={j} className="flex items-start gap-1.5 text-[12.5px] font-semibold text-sky">{a.kind === 'add' ? <Plus size={13} className="mt-0.5 shrink-0" /> : a.kind === 'request' ? <Send size={12} className="mt-0.5 shrink-0" /> : a.kind === 'compare' ? <Columns2 size={13} className="mt-0.5 shrink-0" /> : <Sparkles size={12} className="mt-0.5 shrink-0" />}{a.label}</span>)}
                  {i === turns.length - 1 && t.done.some(a => a.kind === 'add' || a.kind === 'pick') && <button type="button" className="btn btn-ghost btn-sm mt-1 self-start text-muted" onClick={() => { t.done!.filter(a => a.kind === 'add' || a.kind === 'pick').forEach(() => undo()); setTurns(ts => ts.map((x, k) => (k === i ? { ...x, done: [], content: x.content + '\n\n(Undone.)' } : x))) }}><Undo2 size={13} />Undo all of this</button>}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="max-w-[94%] self-start rounded-[12px] bg-raise px-3 py-2 text-[13.5px] leading-snug"><p className="whitespace-pre-wrap">{live || <span className="text-muted">Thinking…</span>}</p></div>}
          {err && <p className="text-[12.5px] text-amber">{err}</p>}
          <div ref={end} />
        </div>
      </div>
      {turns.length > 0 && !busy && (
        <div className="flex gap-1.5 overflow-x-auto border-t border-line px-4 pt-2.5">{SUGGEST.map(s => <button key={s} type="button" className="shrink-0 rounded-full border border-line2 px-2.5 py-1 text-[12px] font-semibold text-muted hover:border-dim hover:text-fg" onClick={() => ask(s)}>{s}</button>)}</div>
      )}
      <form className={cx('flex items-end gap-2 px-4 py-3', !turns.length && 'border-t border-line')} onSubmit={e => { e.preventDefault(); ask(text) }}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={1} placeholder="Ask, or ask for a change" aria-label="Ask the director" className="field max-h-28 min-h-[38px] flex-1 resize-none text-[13.5px]"
          onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); ask(text) } }} />
        {busy
          ? <button type="button" className="icon-btn bg-raise" aria-label="Stop" onClick={() => ctl.current?.abort()}><Square size={15} fill="currentColor" /></button>
          : <button type="submit" className="icon-btn bg-fg text-ink hover:!bg-fg hover:opacity-90" aria-label="Send" disabled={!text.trim()}><ArrowUp size={17} /></button>}
      </form>
    </div>
  )
}

/** Ask is always available: with Claude it reasons; without, it works from the libraries. */
export function useAskAvailable() { return true }
