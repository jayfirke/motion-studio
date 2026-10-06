import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Check, CircleHelp, Clipboard, Clock, Crosshair, Film, HelpCircle, Inbox, Loader2, MessageSquarePlus, Music, Pencil, RotateCcw, Scissors, Search, Send, SquareDashed, Trash2, Undo2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { addPad, deleteNote, deletePad, patchNote, ui, useStudio } from '../../state/store'
import { playback } from '../../engine/playback'
import { toggleComment } from '../player/Controls'
import { NoteThumb } from './NoteThumb'
import type { Activity, Note, NoteCategory, PadNote } from '../../data/types'
import { optLabel } from '../../data/model'
import { copyForClaude, sendState, sendToClaude, type SendState } from '../../lib/bridge'
import { Empty, IconBtn, Kbd, Tip } from '../ui'
import { cx, tc } from '../../lib/util'

const KIND: Record<Note['kind'], { icon: typeof Film; name: string }> = {
  frame: { icon: Crosshair, name: 'On the frame' }, region: { icon: SquareDashed, name: 'Area of the frame' }, range: { icon: Scissors, name: 'Part of the film' },
  sound: { icon: Music, name: 'Sound' }, shot: { icon: Film, name: 'Whole shot' }, revert: { icon: Undo2, name: 'Undo request' }, request: { icon: Wand2, name: 'Request for Claude Code' },
}
export const CATS: Record<NoteCategory, string> = { look: 'Look', motion: 'Motion', sound: 'Sound', voice: 'Voice', copy: 'Words', story: 'Story', other: 'Other' }

/** How far Claude Code has got with a note, in plain words. */
export function claudeState(n: Note): { text: string; tone: 'dim' | 'sky' | 'amber' | 'mint'; spin?: boolean } {
  if (n.claude?.state === 'done' || (n.status === 'done' && n.claude)) return { text: 'Done by Claude', tone: 'mint' }
  if (n.claude?.state === 'working') return { text: 'Claude is working on it', tone: 'sky', spin: true }
  if (n.claude?.state === 'question') return { text: 'Claude has a question', tone: 'amber' }
  if (n.claude?.state === 'wontfix') return { text: 'Claude suggests keeping it', tone: 'amber' }
  if (n.claude?.state === 'seen') return { text: 'Seen by Claude', tone: 'sky' }
  if (n.status === 'done') return { text: 'Resolved by you', tone: 'mint' }
  if (n.sent) return { text: 'Sent · waiting for Claude', tone: 'dim' }
  return { text: 'Not sent to Claude yet', tone: 'dim' }
}
const ago = (iso?: string) => { if (!iso) return ''; const s = (Date.now() - Date.parse(iso)) / 1000; return s < 60 ? 'just now' : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} d ago` }

/** Everything you told Claude, in film order, with Claude Code's progress on each note. */
export function NotesPanel() {
  const notes = useStudio(s => s.notes)
  const sel = useStudio(s => s.selNote)
  const [tab, setTab] = useState<'notes' | 'pad' | 'activity'>('notes')
  const padN = useStudio(s => s.pad.length)
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('all')
  const [cat, setCat] = useState<NoteCategory | 'all'>('all')
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const ql = q.trim().toLowerCase()
    return notes.map((n, i) => ({ n, num: i + 1 }))
      .filter(({ n }) => filter === 'all' || (filter === 'open' ? n.status !== 'done' : n.status === 'done'))
      .filter(({ n }) => cat === 'all' || (n.category || 'other') === cat)
      .filter(({ n }) => !ql || `${n.text} ${n.target} ${(n.quick || []).join(' ')}`.toLowerCase().includes(ql))
      .sort((a, b) => a.n.t - b.n.t)
  }, [notes, filter, cat, q])
  const open = notes.filter(n => n.status !== 'done').length
  const cats = [...new Set(notes.map(n => n.category || 'other'))] as NoteCategory[]
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ClaudeCard />
      <div className="flex items-center gap-2 px-4 pb-2 pt-3">
        <div className="seg flex-1" role="group" aria-label="Comments or activity">
          <button type="button" aria-pressed={tab === 'notes'} onClick={() => setTab('notes')} className="flex-1 justify-center">Comments {notes.length}</button>
          <Tip title="Notes" desc="Free thoughts about the whole film: ideas, reminders, decisions. Claude reads them as background; they are not change requests."><button type="button" aria-pressed={tab === 'pad'} onClick={() => setTab('pad')} className="flex-1 justify-center" data-testid="pad-tab">Notes {padN}</button></Tip>
          <button type="button" aria-pressed={tab === 'activity'} onClick={() => setTab('activity')} className="flex-1 justify-center" data-testid="activity-tab">Activity</button>
        </div>
      </div>
      {tab === 'activity' ? <ActivityFeed /> : tab === 'pad' ? <NotesPad /> : (
        <>
          <div className="flex flex-col gap-2 px-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="seg flex-1" role="group" aria-label="Filter comments">
                {(['all', 'open', 'done'] as const).map(f => <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className="flex-1 justify-center !px-2 text-[12.5px] capitalize">{f === 'open' ? `Open ${open}` : f === 'done' ? `Done ${notes.length - open}` : 'All'}</button>)}
              </div>
              <IconBtn small label="Copy all comments" desc="Copies every comment as plain text, in film order" disabled={!notes.length} onClick={async () => {
                const txt = [...notes].sort((a, b) => a.t - b.t).map((n, i) => `${i + 1}. [${tc(n.t)}${n.t2 != null ? `–${tc(n.t2)}` : ''}] ${n.target}: ${n.text}${n.status === 'done' ? ' (done)' : ''}`).join('\n')
                try { await navigator.clipboard.writeText(txt); toast.success('Comments copied') } catch { toast.error('Copy is blocked here') }
              }}><Clipboard size={15} /></IconBtn>
            </div>
            {cats.length > 1 && (
              <div className="flex flex-wrap gap-1">
                <button type="button" onClick={() => setCat('all')} className={cx('rounded-full px-2.5 py-0.5 text-[12px] font-semibold', cat === 'all' ? 'bg-fg text-ink' : 'bg-raise text-muted')}>All kinds</button>
                {cats.map(c => <button key={c} type="button" onClick={() => setCat(c)} className={cx('rounded-full px-2.5 py-0.5 text-[12px] font-semibold', cat === c ? 'bg-fg text-ink' : 'bg-raise text-muted')}>{CATS[c]}</button>)}
              </div>
            )}
            {notes.length > 3 && (
              <label className="relative block">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search comments" className="field pl-8 text-[13px]" aria-label="Search comments" />
              </label>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-testid="notes">
            {!notes.length ? (
              <Empty icon={<MessageSquarePlus size={28} />} title="No comments yet">
                Press <Kbd>C</Kbd> or the Comment button, then click anything in the frame. Drag a box to cover several parts, or drag across the timeline to mark a stretch of time.
                <button type="button" className="btn btn-ember btn-sm mt-3" onClick={() => { if (ui.get().mode !== 'comment') toggleComment() }}><MessageSquarePlus size={14} />Start commenting</button>
              </Empty>
            ) : !list.length ? <Empty title="Nothing matches">Try another filter or search.</Empty> : (
              <ol className="flex flex-col gap-2">{list.map(({ n, num }) => <NoteItem key={n.id} n={n} num={num} on={sel === n.id} />)}</ol>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Claude Code at a glance: has it read the notes, is it working, and how to send them now. */
function ClaudeCard() {
  const claude = useStudio(s => s.claude)
  const notes = useStudio(s => s.notes)
  const card = useRef<HTMLDivElement>(null)
  const [st, setSt] = useState<SendState | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { let on = true; sendState().then(s => on && setSt(s)); return () => { on = false } }, [notes.length])
  const open = notes.filter(n => n.status !== 'done')
  const unsent = open.filter(n => !n.sent && !n.claude)
  const done = notes.filter(n => n.claude?.state === 'done').length
  const live = st === 'available'
  const status = claude
    ? `${claude.state === 'working' ? 'Working on your comments' : claude.state === 'reading' ? 'Reading your comments' : claude.state === 'publishing' ? 'Publishing a new version' : claude.state === 'waiting' ? 'Waiting for you' : 'Idle'} · ${ago(claude.at)}${claude.message ? ` · ${claude.message}` : ''}`
    : 'Has not picked up comments on this film yet.'
  const send = async () => {
    setBusy(true)
    const ok = await sendToClaude(card.current!, open)
    if (ok) { const at = new Date().toISOString(); open.forEach(n => { if (!n.sent) patchNote(n, { sent: at }) }) }
    setBusy(false)
  }
  return (
    <div ref={card} className="mx-4 mt-1 flex flex-col gap-2 rounded-[12px] border border-line bg-panel2 p-3" data-testid="claude-card">
      <div className="flex items-start gap-2.5">
        <span className={cx('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full', claude?.state === 'working' || claude?.state === 'reading' ? 'bg-sky text-sky-ink' : 'bg-raise text-muted')}>{claude?.state === 'working' || claude?.state === 'reading' ? <Loader2 size={15} className="animate-spin" /> : <Bot size={15} />}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5"><b className="text-[13.5px]">Claude Code</b>{live && <Tip title="Live" desc="A Claude Code session is watching this page: sending reaches it straight away."><span className="tag tag-mint px-1.5 py-0 text-[10.5px]">live</span></Tip>}</div>
          <p className="text-[12.5px] leading-snug text-muted">{status}</p>
          <p className="mt-0.5 text-[12px] text-dim">{open.length} open · {unsent.length} not sent yet · {done} done by Claude</p>
        </div>
        <IconBtn small label="How Claude works with your comments" desc="What happens after you send, and what each status means" onClick={() => ui.set({ overlay: 'claude' })}><CircleHelp size={16} /></IconBtn>
      </div>
      <div className="flex gap-1.5">
        <Tip title={live ? 'Send to Claude Code now' : 'Send to Claude Code'} desc={live ? 'Posts your open comments as a comment on this page and sends it to the Claude Code session watching it.' : 'Copies a ready message to paste into your Claude Code chat (no session is watching this page live).'}>
          <button type="button" className="btn btn-sky btn-sm flex-1" disabled={!open.length || busy} onClick={send} data-testid="send-claude">{busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}Send {open.length || ''} to Claude Code</button>
        </Tip>
        <Tip title="Copy the message" desc="The same message, on your clipboard, to paste into Claude Code yourself">
          <button type="button" className="btn btn-sm" aria-label="Copy the message for Claude Code" disabled={!open.length} onClick={() => copyForClaude(open)}><Clipboard size={14} /></button>
        </Tip>
      </div>
    </div>
  )
}

function ActivityFeed() {
  const acts = useStudio(s => s.activity)
  const notes = useStudio(s => s.notes)
  // Claude's replies on notes are activity too, even before Claude writes a feed line.
  const merged: Activity[] = useMemo(() => {
    const fromNotes: Activity[] = notes.flatMap((n, i) => [
      ...(n.replies || []).filter(r => r.by === 'claude').map((r, j) => ({ id: `${n.id}-r${j}`, at: r.at, by: 'claude', kind: 'reply', text: `On comment ${i + 1} (${n.target}): ${r.text}` })),
      ...(n.reply ? [{ id: `${n.id}-legacy`, at: n.claude?.at || n.at || '', by: 'claude', kind: 'reply', text: `On comment ${i + 1}: ${n.reply}` }] : []),
    ])
    return [...acts, ...fromNotes].sort((a, b) => (b.at || '').localeCompare(a.at || ''))
  }, [acts, notes])
  if (!merged.length) return <div className="px-4"><Empty icon={<Inbox size={26} />} title="No activity yet">When Claude Code reads, changes and publishes, each step shows here with what it did and why.</Empty></div>
  return (
    <ol className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-testid="activity">
      {merged.map(a => (
        <li key={a.id} className="flex gap-2.5 border-b border-line py-2.5 last:border-0">
          <span className={cx('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full', a.by === 'claude' ? 'bg-sky/15 text-sky' : 'bg-raise text-muted')}>{a.by === 'claude' ? <Bot size={13} /> : <Send size={12} />}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 text-[12px]"><b>{a.by === 'claude' ? 'Claude Code' : 'You'}</b><span className="text-dim">{ago(a.at)}</span>{a.version && <span className="tag px-1.5 py-0 text-[10.5px]">{a.version}</span>}</div>
            <p className="text-[13px] leading-snug text-muted">{a.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function NoteItem({ n, num, on }: { n: Note; num: number; on: boolean }) {
  const el = useRef<HTMLLIElement>(null)
  const ver = useStudio(s => s.M?.D.versions?.slice(-1)[0]?.v)
  const prefer = useStudio(s => (n.prefer ? s.M?.DEC[n.prefer.key] : null))
  const [reply, setReply] = useState<string | null>(null)
  const [edit, setEdit] = useState<string | null>(null)
  const [sure, setSure] = useState(false)
  const K = KIND[n.kind] || KIND.frame
  const done = n.status === 'done'
  const cs = claudeState(n)
  useEffect(() => { if (on) el.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [on])
  const jump = () => { ui.set({ selNote: n.id }); if (ui.get().view !== 'watch') return; playback.seek(n.t); if (n.t2 != null) playback.play(n.t, n.t2) }
  const replies = [...(n.reply ? [{ by: 'claude', text: n.reply, at: '' }] : []), ...(n.replies || [])]
  const send = () => { if (!reply?.trim()) return; patchNote(n, { replies: [...(n.replies || []), { by: 'you', text: reply.trim(), at: new Date().toISOString() }], status: 'open' }); setReply(null) }
  const save = () => { if (!edit?.trim()) return; patchNote(n, { text: edit.trim(), edited: new Date().toISOString() }); setEdit(null) }
  return (
    <li ref={el} className={cx('card group cursor-pointer p-3 transition-colors', on ? 'border-ember/70 bg-ember/[.06]' : 'hover:border-line2', done && 'opacity-80')} onClick={jump} data-note={n.id}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {n.kind !== 'revert' && n.kind !== 'request' ? <NoteThumb n={n} w={56} /> : <div className="grid h-10 w-10 place-items-center rounded-[8px] bg-raise text-sky"><K.icon size={18} /></div>}
          <span className={cx('absolute -left-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-[12px_12px_12px_3px] border-2 border-panel px-1 text-[11.5px] font-extrabold', done ? 'bg-mint text-mint-ink' : 'bg-ember text-ember-ink')}>{done ? <Check size={13} strokeWidth={3} /> : num}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
            <Tip title={K.name}><K.icon size={13} /></Tip>
            <span className="mono">{tc(n.t)}{n.t2 != null ? `–${tc(n.t2)}` : ''}</span>
            {n.category && n.category !== 'other' && <span className="tag px-1.5 py-0 text-[10.5px]">{CATS[n.category]}</span>}
            {n.priority === 'nice' && <span className="tag px-1.5 py-0 text-[10.5px]">nice to have</span>}
            {n.intent === 'question' && <span className="tag tag-sky px-1.5 py-0 text-[10.5px]"><HelpCircle size={10} />question</span>}
            {n.version && ver && n.version !== ver && <Tip title={`Written on ${n.version}`} desc={`The film is now ${ver}. Check whether this comment still applies.`}><span className="tag px-1.5 py-0 text-[10.5px]">{n.version}</span></Tip>}
            {n.local && <Tip title="Saved in this browser" desc="The page database was not reachable, so this comment lives only here. Copy it to Claude if needed."><span className="tag tag-amber px-1.5 py-0 text-[10.5px]">local</span></Tip>}
          </div>
          <div className="mt-0.5 truncate text-[13.5px] font-bold" title={n.target}>{n.target}</div>
          {edit != null ? (
            <div className="mt-1 flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
              <textarea autoFocus rows={3} value={edit} onChange={e => setEdit(e.target.value)} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); save() } if (e.key === 'Escape') setEdit(null) }} className="field resize-none text-[13px]" aria-label="Edit comment" />
              <div className="flex gap-1.5"><button type="button" className="btn btn-sm btn-primary" onClick={save}>Save</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setEdit(null)}>Cancel</button></div>
            </div>
          ) : <p className={cx('mt-1 whitespace-pre-wrap text-[13.5px] leading-snug', done && 'line-through decoration-dim')}>{n.text}{n.edited && <span className="ml-1 text-[11px] text-dim">(edited)</span>}</p>}
          {!!n.quick?.length && n.text !== n.quick.join(', ') && <div className="mt-1.5 flex flex-wrap gap-1">{n.quick.map(q => <span key={q} className="tag">{q}</span>)}</div>}
          {n.prefer && prefer && <div className="mt-1.5 text-[12.5px]"><span className="tag tag-sky">Prefers {prefer.q} → {n.prefer.id} · {optLabel(prefer.options.find(o => o.id === n.prefer!.id))}</span></div>}
          <div className={cx('mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold', cs.tone === 'mint' ? 'text-mint' : cs.tone === 'sky' ? 'text-sky' : cs.tone === 'amber' ? 'text-amber' : 'text-dim')} data-testid="claude-state">
            {cs.spin ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}{cs.text}{n.claude?.at && <span className="font-normal text-dim">· {ago(n.claude.at)}</span>}
          </div>
          {n.claude?.msg && <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{n.claude.msg}</p>}
          {replies.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5 border-l-2 border-line2 pl-2.5">
              {replies.map((r, i) => <p key={i} className="text-[13px] leading-snug"><b className={r.by === 'claude' ? 'text-sky' : 'text-fg'}>{r.by === 'claude' ? 'Claude' : 'You'}:</b> <span className="text-muted">{r.text}</span></p>)}
            </div>
          )}
          {reply != null && (
            <div className="mt-2 flex gap-1.5" onClick={e => e.stopPropagation()}>
              <input autoFocus value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter' && !e.nativeEvent.isComposing) send(); if (e.key === 'Escape') setReply(null) }} className="field py-1.5 text-[13px]" placeholder="Reply" aria-label="Reply" />
              <button type="button" className="btn btn-sm" onClick={send}>Send</button>
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100" onClick={e => e.stopPropagation()}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReply('')}>Reply</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => patchNote(n, { status: done ? 'open' : 'done' })}>{done ? <><RotateCcw size={13} />Reopen</> : <><Check size={13} />Resolve</>}</button>
            <Tip title="Ask Claude about this comment" desc="Sends just this comment to Claude Code (live when a session is watching, otherwise copied)"><button type="button" className="btn btn-ghost btn-sm" onClick={async () => { if (await sendToClaude(el.current!, [n])) patchNote(n, { sent: new Date().toISOString() }) }}><Send size={13} />Ask Claude</button></Tip>
            <span className="flex-1" />
            <IconBtn small label="Edit comment" desc="Change the wording of this comment" onClick={() => setEdit(n.text)}><Pencil size={13} /></IconBtn>
            {sure ? (
              <span className="flex items-center gap-1 text-[12px]"><span className="text-muted">Delete?</span><button type="button" className="btn btn-sm btn-ember" onClick={() => deleteNote(n)}>Delete</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setSure(false)}>Keep</button></span>
            ) : <IconBtn small label="Delete comment" desc="Removes this comment for everyone" onClick={() => setSure(true)}><Trash2 size={14} /></IconBtn>}
            <IconBtn small label="Play from here" desc="Jump to this moment" onClick={jump}><Clock size={14} /></IconBtn>
          </div>
        </div>
      </div>
    </li>
  )
}

/** Notes: free thoughts about the whole film. Unlike comments they point at nothing, have no status and are never tasks. */
function NotesPad() {
  const pad = useStudio(s => s.pad)
  const me = useStudio(s => s.me)
  const [text, setText] = useState('')
  const save = async () => { if (!text.trim()) return; await addPad(text); setText('') }
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="pad">
      <div className="flex flex-col gap-2 px-4 pb-3">
        <p className="text-[12.5px] leading-snug text-muted"><b className="text-fg">Notes</b> are your thoughts about the whole film: an idea, a reminder, a decision. Claude reads them as background. To ask for a change, use <b className="text-fg">Comment</b> and point at the part instead.</p>
        <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save() } }}
          rows={3} placeholder="e.g. The audience is people who have never made a video." aria-label="Write a note about the whole film"
          className="w-full resize-none rounded-[10px] border border-line bg-panel2 px-3 py-2 text-[13.5px] leading-snug outline-none focus:border-sky" />
        <div className="flex justify-end"><button type="button" className="btn btn-sm" disabled={!text.trim()} onClick={save} data-testid="pad-save"><Pencil size={13} />Save note</button></div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {!pad.length ? <Empty icon={<Inbox size={20} />} title="No notes yet">Write down anything Claude should keep in mind for this film.</Empty> : (
          <ul className="flex flex-col gap-2">
            {pad.map((p: PadNote) => (
              <li key={p.id} className="rounded-[12px] border border-line bg-panel2 px-3 py-2.5" data-testid="pad-note">
                <p className="whitespace-pre-wrap text-[13.5px] leading-snug">{p.text}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[11.5px] text-dim">
                  <span className="flex-1">{p.who === 'claude' ? 'Claude' : 'You'} · {ago(p.at)}{p.local ? ' · this browser only' : ''}</span>
                  {(p.who !== 'claude' && (!p.by || p.by === me)) && <IconBtn small label="Delete note" onClick={() => deletePad(p)}><Trash2 size={13} /></IconBtn>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
