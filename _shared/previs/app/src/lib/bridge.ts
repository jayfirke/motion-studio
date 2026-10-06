import { toast } from 'sonner'
import { logActivity, ui } from '../state/store'
import type { Note } from '../data/types'
import { tc } from './util'

// The bridge from this page to the Claude Code session that built it.
// 1. Live: the artifact's comments capability can post a comment AND send it to Claude ("Send to Claude"),
//    which reaches any Claude Code session watching this artifact.
// 2. Always: a ready-made message on the clipboard to paste into the Claude Code chat.
// Either way Claude reads the notes from the page database, marks each one, replies, and publishes a new version.

interface Comments {
  canSendToClaude(): Promise<'available' | 'writers_only' | 'no_session' | 'off'>
  anchorFor(el: Element): Promise<unknown>
  sendToClaude(t: { anchor: unknown; text: string } | { threadId: string; text: string }): Promise<{ threadId: string }>
  openComposer(t: { element: Element }): Promise<{ opened: boolean }>
}
interface ClaudeWin { claude?: { use(n: string): Promise<unknown> } }
let commentsP: Promise<Comments | null> | null = null
export function getComments(): Promise<Comments | null> {
  const w = window as unknown as ClaudeWin
  if (!w.claude?.use) return Promise.resolve(null)
  return (commentsP ||= Promise.race([w.claude.use('comments') as Promise<Comments | null>, new Promise<null>(r => setTimeout(() => r(null), 11000))]).catch(() => null))
}
export type SendState = 'available' | 'writers_only' | 'no_session' | 'off' | 'none'
export async function sendState(): Promise<SendState> {
  const c = await getComments(); if (!c) return 'none'
  try { return await c.canSendToClaude() } catch { return 'off' }
}

/** The message Claude Code needs: which film, where the notes live, and what is open. */
export function claudeMessage(only?: Note[]): string {
  const { film, notes, M } = ui.get()
  const list = (only || notes.filter(n => n.status !== 'done'))
  const ver = M?.D.versions?.slice(-1)[0]?.v || 'v0.1'
  const lines = list.slice(0, 25).map((n, i) => `${i + 1}. [${tc(n.t)}${n.t2 != null ? `–${tc(n.t2)}` : ''}] ${n.kind === 'request' ? 'REQUEST' : n.intent === 'question' ? 'QUESTION' : n.priority === 'nice' ? 'nice-to-have' : 'change'} · ${n.target}: ${n.text}${n.prefer ? ` (prefers ${n.prefer.key} → ${n.prefer.id})` : ''}`)
  return [
    `Previs Studio: please work through my comments on ${M?.D.project.product || film?.id} (${ver}).`,
    `Read them from the page database: collection films/${film?.id}/notes (also films/${film?.id}/state/picks, state/custom, state/approval).`,
    `Mark each comment seen, then done with a one-line reply, log what you did in films/${film?.id}/activity, and publish a new version.`,
    `Also read my notes in films/${film?.id}/pad: they are background thoughts about the whole film, not change requests.`,
    '',
    `${list.length} open:`,
    ...lines,
    list.length > 25 ? `…and ${list.length - 25} more in the database.` : '',
  ].filter(x => x !== '').join('\n').slice(0, 3900)
}

export async function copyForClaude(only?: Note[]) {
  const text = claudeMessage(only)
  try { await navigator.clipboard.writeText(text); toast.success('Copied for Claude Code', { description: 'Paste it into your Claude Code chat. Claude reads the comments from this page.' }); logActivity('Copied the open comments for the Claude Code chat', 'note'); return true }
  catch { toast.error('Copy is blocked here', { description: 'Open "How Claude works with your comments" and select the message by hand.' }); return false }
}

/** Posts the open notes as a page comment and sends it to Claude (live sessions watching this page). */
export async function sendToClaude(el: Element, only?: Note[]): Promise<boolean> {
  const c = await getComments()
  if (!c) { return copyForClaude(only) }
  const st = await sendState()
  if (st !== 'available') {
    toast(st === 'no_session' ? 'No Claude Code session is watching this page right now' : 'Live sending is not available here', { description: 'The message is on your clipboard instead: paste it into Claude Code.' })
    return copyForClaude(only)
  }
  try {
    const anchor = await c.anchorFor(el)
    await c.sendToClaude({ anchor, text: claudeMessage(only) })
    toast.success('Sent to Claude Code', { description: 'Claude replies in this page’s comments and marks each comment here as it works.' })
    logActivity(`Sent ${(only || ui.get().notes.filter(n => n.status !== 'done')).length} comments to Claude Code`, 'note')
    return true
  } catch (e) {
    const code = (e as { code?: string })?.code
    if (code === 'consent_required') toast('Allow this page to comment for you, then try again')
    else { toast.error('Could not send', { description: 'Copied to your clipboard instead.' }); return copyForClaude(only) }
    return false
  }
}
