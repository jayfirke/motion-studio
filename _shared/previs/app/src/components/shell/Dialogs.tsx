import * as Dialog from '@radix-ui/react-dialog'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, BadgeCheck, CheckCircle2, Clipboard, MessageSquare, Send, X } from 'lucide-react'
import { claudeMessage, copyForClaude, sendState, sendToClaude, type SendState } from '../../lib/bridge'
import { patchNote, saveApproval, setSide, ui, useStudio } from '../../state/store'
import { optLabel } from '../../data/model'
import { Kbd } from '../ui'
import { cx, modKey, store as ls } from '../../lib/util'

function Shell({ open, onClose, title, desc, wide, children }: { open: boolean; onClose: () => void; title: string; desc?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={o => { if (!o) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="scrim !z-[110]" />
        <Dialog.Content className={cx('pop fixed left-1/2 top-1/2 z-[111] flex max-h-[min(88vh,760px)] w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col', wide ? 'max-w-[720px]' : 'max-w-[520px]')} onKeyDown={e => e.stopPropagation()}>
          <div className="flex items-start gap-3 px-5 pb-2 pt-5">
            <div className="flex-1"><Dialog.Title className="text-[19px] font-bold leading-tight">{title}</Dialog.Title>{desc ? <Dialog.Description className="mt-1 text-[13.5px] text-muted">{desc}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}</div>
            <Dialog.Close className="icon-btn icon-btn-sm -mr-1.5 -mt-1" aria-label="Close"><X size={17} /></Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-2">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ---------------- approve ---------------- */
export function ApproveDialog() {
  const open = useStudio(s => s.overlay === 'approve')
  const M = useStudio(s => s.M), picks = useStudio(s => s.picks), tweaks = useStudio(s => s.tweaks), notes = useStudio(s => s.notes), approval = useStudio(s => s.approval)
  if (!M) return null
  const ver = M.D.versions?.slice(-1)[0]?.v || 'v0.1'
  const changed = M.ORDER.filter(k => picks[k] !== M.DIRECTOR[k])
  const tw = Object.entries(tweaks).filter(([, v]) => (v.dt || 0) !== 0 || (v.db || 0) !== 0 || v.on === false)
  const openN = notes.filter(n => n.status !== 'done').length
  const approved = approval?.approved && approval.version === ver
  const close = () => ui.set({ overlay: null })
  const twName = (k: string) => k.startsWith('lane.') ? `${{ vo: 'Voice', music: 'Music', sfx: 'Sounds' }[k.slice(5)] || k} volume` : k === 'mix.duck' ? 'Music dip under the voice' : M.DEC[k]?.q || k
  const twVal = (v: { dt?: number; db?: number; on?: boolean }) => [v.on === false ? 'off' : '', v.dt ? `${v.dt > 0 ? '+' : ''}${Math.round(v.dt * 1000)} ms` : '', v.db ? `${v.db > 0 ? '+' : ''}${v.db.toFixed(1)} dB` : ''].filter(Boolean).join(', ')
  return (
    <Shell open={open} onClose={close} title={approved ? `${ver} is approved` : `Approve ${ver}?`} desc={approved ? 'Claude builds the real video from these picks. You can still withdraw.' : 'Claude will freeze these picks into the production spec and build the real video. Nothing is rendered before you approve.'}>
      <div className="flex flex-col gap-4">
        <section>
          <div className="label mb-1.5">Your changes to the director's plan</div>
          {changed.length ? (
            <ul className="flex flex-col gap-1">{changed.map(k => { const d = M.DEC[k]; return (
              <li key={k} className="flex flex-wrap items-baseline gap-x-2 rounded-[8px] bg-panel2 px-3 py-2 text-[13.5px]">
                <b className="mr-1">{d.q}{d.scene ? <span className="font-normal text-dim"> · shot {M.D.scenes.findIndex(s => s.id === d.scene) + 1}</span> : null}</b>
                <span className="text-muted line-through decoration-dim">{optLabel(d.options.find(o => o.id === M.DIRECTOR[k]))}</span><ArrowRight size={12} className="self-center text-dim" /><span className="text-sky">{optLabel(d.options.find(o => o.id === picks[k]))}</span>
              </li>) })}</ul>
          ) : <p className="text-[13.5px] text-muted">None. You are approving the director's recommended picks.</p>}
        </section>
        {tw.length > 0 && (
          <section>
            <div className="label mb-1.5">Sound adjustments</div>
            <ul className="flex flex-col gap-1">{tw.map(([k, v]) => <li key={k} className="flex justify-between gap-3 rounded-[8px] bg-panel2 px-3 py-2 text-[13.5px]"><span>{twName(k)}</span><span className="mono text-sky">{twVal(v)}</span></li>)}</ul>
          </section>
        )}
        <section className={cx('flex items-start gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px]', openN ? 'bg-amber/10 text-amber' : 'bg-mint/10 text-mint')}>
          {openN ? <MessageSquare size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
          <span>{openN ? `${openN} open comment${openN > 1 ? 's' : ''} will go to Claude with this approval. Claude applies them while building.` : 'No open comments.'}{openN > 0 && <button type="button" className="ml-1.5 font-semibold underline" onClick={() => { close(); setSide('notes') }}>Review comments</button>}</span>
        </section>
        <section>
          <div className="label mb-1.5">What happens next</div>
          <ol className="flex flex-col gap-1 text-[13.5px] text-muted">
            {(M.D.pipeline?.steps || ['Freeze the approved spec', 'Build the film', 'Self-check', 'Render']).slice(0, 5).map((s, i) => <li key={i} className="flex gap-2"><span className="mono text-dim">{i + 1}.</span>{s}</li>)}
          </ol>
        </section>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {approved
            ? <><button type="button" className="btn" onClick={() => { saveApproval(false); close() }}>Withdraw approval</button><button type="button" className="btn btn-primary" onClick={close}>Done</button></>
            : <><button type="button" className="btn" onClick={close}>Not yet</button><button type="button" className="btn btn-go" onClick={() => { saveApproval(true); close() }} data-testid="confirm-approve"><BadgeCheck size={16} />Approve {ver}</button></>}
        </div>
      </div>
    </Shell>
  )
}

/* ---------------- help ---------------- */
const KEYS: [string[], string][] = [
  [['Space'], 'Play or pause'], [['←', '→'], 'One frame back or forward'], [['⇧', '←/→'], 'One second back or forward'], [['J', 'L'], 'Two seconds back or forward'],
  [['[', ']'], 'Previous or next shot'], [['Home'], 'Back to the start'], [['C'], 'Comment mode on or off'], [['⇧', 'drag'], 'On the shots row: comment a stretch of time'], [['P'], 'Draw (in comment mode)'], [['A'], 'Arrow (in comment mode)'],
  [['N'], 'Next comment'], [['S'], 'Captions on or off'], [['⇧', 'N'], 'Previous comment'], [['\\'], 'Hold to hear the original picks'], [['F'], 'Full screen'], [['M'], 'Mute'],
  [[modKey, 'Z'], 'Undo'], [['⇧', modKey, 'Z'], 'Redo'], [[modKey, 'K'], 'Search choices and commands'], [['1', '2', '3'], 'Watch, Storyboard, Plan'], [['Esc'], 'Close or step back'],
]
export function HelpDialog() {
  const open = useStudio(s => s.overlay === 'help')
  const close = () => ui.set({ overlay: null })
  return (
    <Shell open={open} onClose={close} wide title="How Previs Studio works" desc="You are looking at a plan for a video, not the video itself. Shape it here; Claude builds the real thing after you approve.">
      <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]">
        <ol className="flex flex-col gap-3">
          {[
            ['Watch', 'Press play. Everything is a quick preview with real music, voice and sounds.'],
            ['Change', 'Open Choices. Every decision has three options. Click one and that moment replays with it.'],
            ['Comment', 'Press C, then click any part of the frame. Drag a box to cover several parts, or drag across the timeline to mark a stretch of time.'],
            ['More options', 'Every choice has "More options": a library of looks, music, motion, voices and more, or describe what you want ("simple and sober"). The Ask tab does the same in plain words.'],
            ['Send to Claude Code', 'Comments → Send to Claude Code. Claude marks each comment Seen, Working and Done, replies, and publishes a new version.'],
            ['Approve', 'When it feels right, press Approve. Claude freezes your picks and builds the video.'],
          ].map(([t, d], i) => <li key={t} className="flex gap-3"><span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-full bg-raise text-[12px] font-bold">{i + 1}</span><div><b className="text-[14px]">{t}</b><p className="text-[13px] leading-snug text-muted">{d}</p></div></li>)}
          <button type="button" className="btn btn-sm mt-1 self-start" onClick={() => { ui.set({ overlay: 'tour' }) }}>Show me around again</button>
        </ol>
        <div>
          <div className="label mb-2">Keyboard</div>
          <table className="w-full text-[13px]"><tbody>
            {KEYS.map(([k, d]) => <tr key={d} className="border-b border-line last:border-0"><td className="py-1.5 pr-3"><span className="flex flex-wrap gap-1">{k.map(x => <Kbd key={x}>{x}</Kbd>)}</span></td><td className="text-muted">{d}</td></tr>)}
          </tbody></table>
        </div>
      </div>
    </Shell>
  )
}

/* ---------------- first-run tour ---------------- */
const TOUR = [
  { at: 'frame', title: 'This is your film', body: 'A quick preview with real music, voice and sounds. Click the frame or press Space to play.' },
  { at: 'side', title: 'Change anything', body: 'Every decision has three options. Click one and that moment replays right away with your pick.' },
  { at: 'comment', title: 'Point at what to change', body: 'Press Comment, then click any part of the frame. Drag a box around several parts, or draw.' },
  { at: 'timeline', title: 'Shots and sound', body: 'Shots on top, then voice, music and sounds. Drag across the shots to comment a stretch of time; drag a sound to move it.' },
  { at: 'claude', title: 'Claude Code picks up your comments', body: 'Send your comments from here or from the Comments tab. You see each one move from Seen to Done, with Claude\u2019s reply.' },
  { at: 'approve', title: 'Approve when it feels right', body: 'Claude builds the real video only after you approve.' },
]
export function Tour() {
  const open = useStudio(s => s.overlay === 'tour')
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const steps = TOUR.filter(s => document.querySelector(`[data-tour="${s.at}"]`))
  const s = steps[Math.min(i, steps.length - 1)]
  useEffect(() => { if (open) setI(0) }, [open])
  useLayoutEffect(() => {
    if (!open || !s) return
    // Follow the target while layout settles (fonts, panels, resizes).
    let raf = 0, last = ''
    const upd = () => {
      const el = document.querySelector(`[data-tour="${s.at}"]`), r = el ? el.getBoundingClientRect() : null
      const k = r ? [r.left, r.top, r.width, r.height].map(Math.round).join() : ''
      if (k !== last) { last = k; setRect(r) }
      raf = requestAnimationFrame(upd)
    }
    upd(); return () => cancelAnimationFrame(raf)
  }, [open, s])
  if (!open || !s) return null
  const done = () => { ui.set({ overlay: null }); ls.set('studio2:toured', true) }
  const W = 300, vw = innerWidth, vh = innerHeight
  let left = vw / 2 - W / 2, top = vh / 2 - 80
  if (rect) {
    const room = { r: vw - rect.right, l: rect.left, b: vh - rect.bottom, t: rect.top }
    if (room.r > W + 24) { left = rect.right + 16; top = rect.top + Math.min(rect.height / 2 - 60, 120) }
    else if (room.l > W + 24) { left = rect.left - W - 16; top = rect.top + Math.min(rect.height / 2 - 60, 120) }
    else if (room.b > 190) { left = rect.left + rect.width / 2 - W / 2; top = rect.bottom + 14 }
    else { left = rect.left + rect.width / 2 - W / 2; top = rect.top - 190 }
  }
  left = Math.max(10, Math.min(vw - W - 10, left)); top = Math.max(10, Math.min(vh - 200, top))
  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-label="Quick tour" onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') done() }}>
      {rect ? <div className="pointer-events-none absolute rounded-[14px] transition-all duration-200" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: '0 0 0 3px var(--color-ember), 0 0 0 9999px rgba(0,0,0,.62)' }} /> : <div className="absolute inset-0 bg-black/60" />}
      <div className="pop absolute flex flex-col gap-2 p-4" style={{ left, top, width: W }}>
        <div className="flex items-center justify-between text-[12px] text-dim"><span>{i + 1} of {steps.length}</span><button type="button" className="font-semibold hover:text-fg" onClick={done}>Skip</button></div>
        <b className="text-[16px] leading-tight">{s.title}</b>
        <p className="text-[13.5px] leading-snug text-muted">{s.body}</p>
        <div className="mt-1 flex justify-end gap-2">
          {i > 0 && <button type="button" className="btn btn-sm" onClick={() => setI(i - 1)}>Back</button>}
          {i < steps.length - 1 ? <button type="button" className="btn btn-sm btn-primary" autoFocus onClick={() => setI(i + 1)}>Next</button> : <button type="button" className="btn btn-sm btn-ember" autoFocus onClick={done}>Start reviewing</button>}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Claude Code bridge ---------------- */
export function ClaudeDialog() {
  const open = useStudio(s => s.overlay === 'claude')
  const notes = useStudio(s => s.notes)
  const claude = useStudio(s => s.claude)
  const box = useRef<HTMLDivElement>(null)
  const [st, setSt] = useState<SendState | null>(null)
  useEffect(() => { if (open) sendState().then(setSt) }, [open])
  const close = () => ui.set({ overlay: null })
  const openNotes = notes.filter(n => n.status !== 'done')
  const msg = open ? claudeMessage(openNotes) : ''
  const steps: [string, string][] = [
    ['You leave comments', 'Point at anything and write what should change. Each comment is saved in this page’s database with your current picks, so Claude sees exactly what you saw.'],
    ['You send them to Claude Code', st === 'available' ? 'A Claude Code session is watching this page right now: Send posts your comments as a page comment and Claude gets them straight away.' : 'Send copies a ready message. Paste it into your Claude Code chat (the session that made this film). When a session is watching the page, Send reaches it directly instead.'],
    ['Claude works through them', 'Each comment moves from Seen to Working to Done, with a one-line reply, or Claude asks a question. Claude changes only what a comment points at and logs every step under Comments → Activity.'],
    ['A new version arrives', 'Claude publishes the update to the same link. A banner shows what changed, and Plan → Versions lets you ask to undo any change.'],
  ]
  return (
    <Shell open={open} onClose={close} wide title="How Claude Code works with your comments" desc="Your comments are the to-do list for the next version. Nothing changes in the film until Claude applies them; nothing is rendered until you approve.">
      <div ref={box} className="grid gap-5 md:grid-cols-[1.1fr_1fr]">
        <ol className="flex flex-col gap-3">
          {steps.map(([t, d], i) => <li key={t} className="flex gap-3"><span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-full bg-raise text-[12px] font-bold">{i + 1}</span><div><b className="text-[14px]">{t}</b><p className="text-[13px] leading-snug text-muted">{d}</p></div></li>)}
          <div className="mt-1 flex flex-wrap gap-1.5 text-[12px]">
            <span className="tag">Not sent yet</span><span className="tag">Sent · waiting</span><span className="tag tag-sky">Seen by Claude</span><span className="tag tag-sky">Working</span><span className="tag tag-amber">Question</span><span className="tag tag-mint">Done by Claude</span>
          </div>
        </ol>
        <div className="flex flex-col gap-2">
          <div className="label">Claude Code now</div>
          <p className="text-[13px] text-muted">{claude ? `${claude.state} · ${claude.message || 'no message'} (${new Date(claude.at).toLocaleString()})` : 'Has not picked up comments on this film yet.'} {st === 'available' ? 'A session is watching this page.' : st === 'no_session' ? 'No session is watching this page right now.' : ''}</p>
          <div className="label mt-2">The message Claude gets</div>
          <textarea readOnly value={msg} rows={9} className="field mono resize-none text-[11.5px]" aria-label="Message for Claude Code" onFocus={e => e.currentTarget.select()} />
          <div className="flex gap-2">
            <button type="button" className="btn btn-sky flex-1" disabled={!openNotes.length} onClick={async () => { if (await sendToClaude(box.current!, openNotes)) { const at = new Date().toISOString(); openNotes.forEach(n => { if (!n.sent) patchNote(n, { sent: at }) }); close() } }}><Send size={15} />{st === 'available' ? 'Send now' : 'Send (copy)'}</button>
            <button type="button" className="btn" disabled={!openNotes.length} onClick={() => copyForClaude(openNotes)}><Clipboard size={15} />Copy</button>
          </div>
        </div>
      </div>
    </Shell>
  )
}
