import { create } from 'zustand'
import { toast } from 'sonner'
import type { Activity, Approval, Box, ClaudeStatus, FilmRef, Note, NoteCategory, Option, Picks, Previs, Stroke, Tweaks } from '../data/types'
import { buildModel, makeCtx, optLabel, type Ctx, type Custom, type Model } from '../data/model'
import { validatePrevis } from '../data/schema'
import type { Lane, Mix } from '../engine/audio'
import { audio } from '../engine/audio'
import { store as ls } from '../lib/util'
import { getDb, getUser, type DB } from '../lib/claude'

export type View = 'home' | 'watch' | 'board' | 'plan'
export type Side = 'choices' | 'notes' | 'steps' | 'ask'
export type Tool = 'point' | 'pen' | 'arrow'
export interface Draft {
  kind: Note['kind']; a: number; b?: number | null; target: string; targets?: string[]; key?: string; x?: number; y?: number; box?: Box | null
  strokes: Stroke[]; quick: string[]; scene?: string; anchor?: { x: number; y: number }
  category?: NoteCategory; priority?: 'must' | 'nice'; intent?: 'change' | 'question'; prefer?: { key: string; id: string } | null
}
export interface Compare { key: string; ids: string[]; hear: number }
export interface Prefs { theme: 'system' | 'light' | 'dark'; captions: boolean; replay: boolean }
interface Snap { picks: Picks; tweaks: Tweaks; custom: Custom; label: string }

interface State {
  films: FilmRef[]
  film: FilmRef | null
  raw: Previs | null
  M: Model | null
  problems: string[] | null
  loading: boolean
  picks: Picks
  tweaks: Tweaks
  custom: Custom
  hold: boolean
  C: Ctx | null
  past: Snap[]
  future: Snap[]
  notes: Note[]
  approval: Approval | null
  claude: ClaudeStatus | null
  activity: Activity[]
  view: View
  T: number
  playing: boolean
  rate: number
  loop: boolean
  mode: 'watch' | 'comment'
  tool: Tool
  side: Side
  drawer: boolean
  peek: boolean
  compare: Compare | null
  step: number
  selNote: string | null
  draft: Draft | null
  mix: Mix
  full: boolean
  sync: 'local' | 'connecting' | 'live'
  saving: 'idle' | 'saving' | 'saved' | 'error'
  me: string | null
  prefs: Prefs
  overlay: null | 'help' | 'palette' | 'approve' | 'tour' | 'claude' | 'settings'
  /** The decision whose "More options" library is open. */
  library: string | null
  /** The storyboard shot sheet that is open. */
  sheet: string | null
}

const MIX0: Mix = { solo: null, mute: { vo: false, music: false, sfx: false }, db: { vo: 0, music: 0, sfx: 0 }, duck: true, muted: false, volume: 1 }
const PREFS0: Prefs = { theme: 'system', captions: false, replay: true, ...(ls.get<Partial<Prefs>>('studio2:prefs') || {}) }

export const useStudio = create<State>(() => ({
  films: [], film: null, raw: null, M: null, problems: null, loading: true,
  picks: {}, tweaks: {}, custom: {}, hold: false, C: null, past: [], future: [],
  notes: [], approval: null, claude: null, activity: [],
  view: 'watch', T: 0, playing: false, rate: 1, loop: false,
  mode: 'watch', tool: 'point', side: (ls.get<Side>('studio2:side') || 'steps'), drawer: false, peek: false, compare: null, step: -1, selNote: null, draft: null,
  mix: MIX0, full: false, sync: 'connecting', saving: 'idle', me: null, prefs: PREFS0, overlay: null, library: null, sheet: null,
}))

const set = useStudio.setState
const get = useStudio.getState
const key = (s: string) => `studio2:${get().film?.id}:${s}`

/* ---------------- derived context ---------------- */
function recompute() {
  const { M, picks, tweaks, hold } = get()
  if (!M) return
  set({ C: makeCtx(M, hold ? M.DIRECTOR : picks, hold ? {} : tweaks) })
}
export const ctxFor = (picks: Picks) => { const { M, tweaks } = get(); return M ? makeCtx(M, picks, tweaks) : null }
function rebuild() {
  const { raw, custom } = get(); if (!raw) return
  set({ M: buildModel(raw, custom) })
}

/* ---------------- films ---------------- */
export async function loadFilms() {
  let films: FilmRef[] = []
  try { const r = await fetch('films.json', { cache: 'no-store' }); if (r.ok) films = await r.json() } catch { /* none */ }
  set({ films })
  if (!films.length) { set({ loading: false, problems: ['No films yet: films.json is missing or empty.'] }); return }
  const want = location.hash.replace('#', '')
  const f = films.find(x => x.id === want) || (films.length === 1 ? films[0] : null)
  if (f) await openFilm(f)
  else set({ view: 'home', loading: false })
  getUser().then(async u => { if (u) { try { set({ me: await u.id() }) } catch { /* anonymous */ } } })
}

const cache = new Map<string, unknown>()
export async function fetchFilm(f: FilmRef) {
  if (cache.has(f.id)) return cache.get(f.id)
  const r = await fetch(f.path + 'previs.json', { cache: 'no-store' })
  if (!r.ok) throw new Error(`previs.json not found for ${f.id}`)
  const j = await r.json(); cache.set(f.id, j); return j
}

let unsubs: (() => void)[] = []
export async function openFilm(f: FilmRef) {
  unsubs.forEach(u => u()); unsubs = []
  set({ loading: true, film: f, problems: null })
  let raw: unknown
  try { raw = await fetchFilm(f) } catch (e) { set({ loading: false, problems: [String((e as Error).message)] }); return }
  const v = validatePrevis(raw)
  if (!v.ok) { set({ loading: false, problems: v.problems }); return }
  const custom = ls.get<Custom>(`studio2:${f.id}:custom`) || {}
  const M = buildModel(v.data, custom)
  audio.setBase(f.path)
  const saved = ls.get<{ picks: Picks; tweaks: Tweaks }>(`studio2:${f.id}:state`)
  const picks = { ...M.DIRECTOR, ...(saved?.picks || {}) }
  Object.keys(picks).forEach(k => { if (!M.DEC[k] || !M.DEC[k].options.some(o => o.id === picks[k])) picks[k] = M.DIRECTOR[k] })
  const tweaks = saved?.tweaks || {}
  const view = (ls.get<View>(`studio2:${f.id}:view`) || 'watch') as View
  set({ raw: v.data, custom, M, picks, tweaks, past: [], future: [], notes: ls.get<Note[]>(`studio2:${f.id}:notes`) || [], approval: ls.get<Approval>(`studio2:${f.id}:approval`), claude: null, activity: [], view: view === 'home' ? 'watch' : view, loading: false, compare: null, draft: null, step: -1, selNote: null, mode: 'watch', library: null, sheet: null, T: M.D.scenes[0].key ?? 0.8 })
  applyLaneTweaks()
  recompute()
  if (location.hash.replace('#', '') !== f.id && get().films.length > 1) history.replaceState(null, '', '#' + f.id)
  connect(f)
}

function applyLaneTweaks() {
  const t = get().tweaks, mix = { ...get().mix, db: { ...get().mix.db } }
  ;(['vo', 'music', 'sfx'] as Lane[]).forEach(l => { mix.db[l] = t[`lane.${l}`]?.db || 0 })
  mix.duck = t['mix.duck'] ? t['mix.duck'].on !== false : true
  set({ mix }); audio.applyMix(mix)
}

/* ---------------- sync with the page database ---------------- */
let db: DB | null = null
let lastRemotePicks: Picks | null = null
function applyRemotePicks(remote: Picks) {
  const M = get().M; if (!M) return false
  const picks = { ...get().picks }; let ch = false
  Object.entries(remote).forEach(([k, v]) => { if (M.DEC[k]?.options.some(o => o.id === v) && picks[k] !== v) { picks[k] = v; ch = true } })
  if (ch) set({ picks })
  return ch
}
async function connect(f: FilmRef) {
  set({ sync: 'connecting' })
  db = await getDb()
  if (!db || get().film?.id !== f.id) { set({ sync: 'local' }); return }
  set({ sync: 'live' })
  const local = () => get().notes.filter(n => n.local)
  let first = true
  unsubs.push(db.collection(`films/${f.id}/notes`).onSnapshot(s => {
    const prev = new Map(get().notes.map(n => [n.id, n]))
    const notes = [...s.docs.map(d => ({ ...(d.data() as unknown as Note), id: d.id })), ...local()]
    if (!first) notes.forEach((n, i) => {
      const p = prev.get(n.id); if (!p) return
      const cr = (x: Note) => (x.replies || []).filter(r => r.by === 'claude').length + (x.reply ? 1 : 0)
      if (cr(n) > cr(p)) toast(`Claude replied on note ${i + 1}`, { description: (n.replies || []).filter(r => r.by === 'claude').slice(-1)[0]?.text || n.reply })
      else if (n.claude?.state && n.claude.state !== p.claude?.state) toast(`Claude: note ${i + 1} ${n.claude.state === 'done' ? 'is done' : n.claude.state === 'working' ? 'is being worked on' : n.claude.state === 'seen' ? 'was read' : 'has a question'}`)
    })
    first = false
    set({ notes })
  }, () => set({ sync: 'local' })))
  unsubs.push(db.doc(`films/${f.id}/state/custom`).onSnapshot(s => {
    if (!s.exists || customPending) return
    const d = s.data() as { options?: Custom }
    if (JSON.stringify(d.options || {}) === JSON.stringify(get().custom)) return
    set({ custom: d.options || {} }); ls.set(key('custom'), d.options || {}); rebuild()
    if (lastRemotePicks) applyRemotePicks(lastRemotePicks)
    recompute()
  }))
  unsubs.push(db.doc(`films/${f.id}/state/picks`).onSnapshot(s => {
    if (!s.exists || pending) return // our own newer change is still on its way; its echo will match
    const d = s.data() as { picks?: Picks; tweaks?: Tweaks }
    lastRemotePicks = d.picks || {}
    let ch = applyRemotePicks(lastRemotePicks)
    if (d.tweaks && JSON.stringify(d.tweaks) !== JSON.stringify(get().tweaks)) { set({ tweaks: d.tweaks }); ch = true; applyLaneTweaks() }
    if (ch) recompute()
  }))
  unsubs.push(db.doc(`films/${f.id}/state/approval`).onSnapshot(s => set({ approval: s.exists ? (s.data() as unknown as Approval) : null })))
  unsubs.push(db.doc(`films/${f.id}/state/claude`).onSnapshot(s => set({ claude: s.exists ? (s.data() as unknown as ClaudeStatus) : null })))
  unsubs.push(db.collection(`films/${f.id}/activity`).onSnapshot(s => {
    const acts = s.docs.map(d => ({ ...(d.data() as unknown as Activity), id: d.id })).sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 80)
    set({ activity: acts })
  }))
}

let saveTimer: number | undefined
let pending = false
function persistState() {
  const { picks, tweaks, film } = get(); if (!film) return
  ls.set(key('state'), { picks, tweaks })
  window.clearTimeout(saveTimer)
  set({ saving: 'saving' })
  pending = true
  saveTimer = window.setTimeout(async () => {
    if (!db) { pending = false; set({ saving: 'saved' }); return }
    const { picks: p, tweaks: t } = get()
    try { await db.doc(`films/${film.id}/state/picks`).set({ picks: p, tweaks: t, at: new Date().toISOString() }); set({ saving: 'saved' }) } catch { set({ saving: 'error' }) }
    finally { pending = false }
  }, 700)
}
let customPending = false
async function persistCustom() {
  const { custom, film } = get(); if (!film) return
  ls.set(key('custom'), custom)
  if (!db) return
  customPending = true
  try { await db.doc(`films/${film.id}/state/custom`).set({ options: custom, at: new Date().toISOString() }) } catch { toast.error('Added options are saved in this browser only') }
  finally { customPending = false }
}

/* ---------------- choices, tweaks, undo ---------------- */
function snapshot(label: string) { const { picks, tweaks, custom, past } = get(); set({ past: [...past.slice(-60), { picks: { ...picks }, tweaks: JSON.parse(JSON.stringify(tweaks)), custom: JSON.parse(JSON.stringify(custom)), label }], future: [] }) }
export function setPick(k: string, id: string) {
  const { picks, M } = get(); if (!M || picks[k] === id) return
  const d = M.DEC[k]; const o = d.options.find(x => x.id === id)
  snapshot(`${d.q}: ${optLabel(o) || id}`)
  set({ picks: { ...picks, [k]: id } }); recompute(); persistState()
}
export function resetPicks(keys?: string[]) {
  const { M, picks } = get(); if (!M) return
  snapshot(keys ? 'Reset choice' : 'Back to the recommended picks')
  const next = { ...picks }; (keys || M.ORDER).forEach(k => { next[k] = M.DIRECTOR[k] })
  set({ picks: next }); recompute(); persistState()
}
export function setTweak(k: string, patch: { dt?: number; db?: number; on?: boolean }, label = 'Sound change') {
  snapshot(label)
  const t = { ...get().tweaks, [k]: { ...(get().tweaks[k] || {}), ...patch } }
  set({ tweaks: t }); if (k.startsWith('lane.') || k === 'mix.duck') applyLaneTweaks(); recompute(); persistState()
}
const LETTERS = 'DEFGHIJKLMNOPQRSTUVWXYZ'
/** Adds an option to a decision (from a library, the AI director or the reviewer). Returns its new id. */
export function addOption(k: string, opt: Option, o: { pick?: boolean; origin?: Option['origin'] } = {}): string | null {
  const { M, custom } = get(); if (!M || !M.DEC[k]) return null
  const d = M.DEC[k]
  if (opt.ref) { const dupe = d.options.find(x => x.ref === opt.ref || x.id === opt.ref); if (dupe) { if (o.pick) setPick(k, dupe.id); return dupe.id } }
  const id = LETTERS.split('').find(l => !d.options.some(x => x.id === l)) || `X${d.options.length}`
  snapshot(`Added ${optLabel(opt)} to ${d.q}`)
  const added: Option = { ...opt, id, origin: o.origin || opt.origin || 'library' }
  set({ custom: { ...custom, [k]: [...(custom[k] || []), added] } })
  rebuild()
  if (o.pick) set({ picks: { ...get().picks, [k]: id } })
  recompute(); persistCustom(); if (o.pick) persistState()
  return id
}
export function removeOption(k: string, id: string) {
  const { custom, picks, M } = get(); if (!M) return
  const list = custom[k] || []; if (!list.some(o => o.id === id)) return
  snapshot('Removed an added option')
  set({ custom: { ...custom, [k]: list.filter(o => o.id !== id) } })
  if (picks[k] === id) set({ picks: { ...picks, [k]: M.DIRECTOR[k] } })
  rebuild(); recompute(); persistCustom(); persistState()
}
function restore(s: Snap) {
  const customChanged = JSON.stringify(s.custom) !== JSON.stringify(get().custom)
  set({ picks: s.picks, tweaks: s.tweaks, custom: s.custom })
  if (customChanged) { rebuild(); persistCustom() }
  applyLaneTweaks(); recompute(); persistState()
}
export function undo() {
  const { past, future, picks, tweaks, custom } = get(); const s = past[past.length - 1]
  if (!s) { toast('Nothing to undo'); return }
  set({ past: past.slice(0, -1), future: [...future, { picks, tweaks, custom, label: s.label }] }); restore(s)
  toast(`Undid: ${s.label}`)
}
export function redo() {
  const { past, future, picks, tweaks, custom } = get(); const s = future[future.length - 1]
  if (!s) { toast('Nothing to redo'); return }
  set({ future: future.slice(0, -1), past: [...past, { picks, tweaks, custom, label: s.label }] }); restore(s)
  toast(`Redid: ${s.label}`)
}
export function setHold(on: boolean) { if (get().hold === on) return; set({ hold: on }); recompute() }

/* ---------------- mix ---------------- */
export function setMix(patch: Partial<Mix>) { const mix = { ...get().mix, ...patch }; set({ mix }); audio.applyMix(mix) }
export function laneVolume(l: Lane, d: number) { const v = Math.max(-12, Math.min(12, (get().mix.db[l] || 0) + d)); setTweak(`lane.${l}`, { db: v }, `${l === 'vo' ? 'Voice' : l === 'music' ? 'Music' : 'Sounds'} volume`) }

/* ---------------- preferences ---------------- */
export function setPrefs(patch: Partial<Prefs>) { const prefs = { ...get().prefs, ...patch }; set({ prefs }); ls.set('studio2:prefs', prefs) }

/* ---------------- notes ---------------- */
export const verName = () => get().M?.D.versions?.slice(-1)[0]?.v || 'v0.1'
export async function addNote(draft: Draft, text: string): Promise<Note | null> {
  const { C, film, picks, me } = get(); if (!C || !film) return null
  const n: Omit<Note, 'id'> = {
    t: +draft.a.toFixed(2), t2: draft.b != null ? +draft.b.toFixed(2) : null, kind: draft.kind, target: draft.target, targets: draft.targets || [],
    key: draft.key || '', x: draft.x != null ? +draft.x.toFixed(4) : null, y: draft.y != null ? +draft.y.toFixed(4) : null,
    box: draft.box ? { x: +draft.box.x.toFixed(4), y: +draft.box.y.toFixed(4), w: +draft.box.w.toFixed(4), h: +draft.box.h.toFixed(4) } : null,
    strokes: draft.strokes.map(s => ({ tool: s.tool, pts: s.pts.map(p => [+p[0].toFixed(4), +p[1].toFixed(4)] as [number, number]) })),
    quick: draft.quick, text: text || draft.quick.join(', '), scene: draft.scene || C.at(draft.a).sc.id, picks: { ...picks }, version: verName(),
    status: 'open', reply: '', replies: [], by: me || '', at: new Date().toISOString(),
    category: draft.category || 'other', priority: draft.priority || 'must', intent: draft.intent || 'change', prefer: draft.prefer || null, claude: null,
  }
  if (db) {
    try { const ref = await db.collection(`films/${film.id}/notes`).add(n as unknown as Record<string, unknown>); toast.success(draft.kind === 'request' ? 'Request filed for Claude Code' : 'Note saved for Claude', { description: 'Send your notes to Claude Code from the Notes tab when you are ready.' }); return { ...n, id: (ref as unknown as { id?: string }).id || 'new' } }
    catch { /* fall back below */ }
  }
  const local: Note = { ...n, id: 'local-' + Date.now().toString(36), local: true }
  const notes = [...get().notes, local]; set({ notes }); ls.set(key('notes'), notes.filter(x => x.local))
  toast.success(db ? 'Saved in this browser (the page database refused it)' : 'Note saved in this browser')
  return local
}
/** A job only Claude Code can do (record a new line, find a sound outside the library...). */
export function addRequest(text: string, scene?: string) {
  const C = get().C; if (!C) return
  return addNote({ kind: 'request', a: scene ? C.of(scene).start : 0, target: 'Request for Claude Code', strokes: [], quick: [], scene: scene || C.TL[0].sc.id, intent: 'change', category: 'other', priority: 'must' }, text)
}
export async function patchNote(n: Note, patch: Partial<Note>) {
  const { film } = get(); if (!film) return
  if (n.local || !db) { const notes = get().notes.map(x => (x.id === n.id ? { ...x, ...patch } : x)); set({ notes }); ls.set(key('notes'), notes.filter(x => x.local)); return }
  try { await db.doc(`films/${film.id}/notes/${n.id}`).update(patch as Record<string, unknown>) } catch { toast.error('Could not update the note') }
}
export async function deleteNote(n: Note) {
  const { film } = get(); if (!film) return
  if (n.local || !db) { const notes = get().notes.filter(x => x.id !== n.id); set({ notes }); ls.set(key('notes'), notes.filter(x => x.local)); return }
  try { await db.doc(`films/${film.id}/notes/${n.id}`).delete() } catch { toast.error('Could not delete the note') }
}
/** Your side of the activity feed (Claude Code writes its own lines). */
export async function logActivity(text: string, kind = 'note') {
  const { film } = get(); if (!film) return
  const a = { at: new Date().toISOString(), by: 'you', kind, text }
  if (db) { try { await db.collection(`films/${film.id}/activity`).add(a); return } catch { /* local below */ } }
  set({ activity: [{ ...a, id: 'local-' + Date.now().toString(36) }, ...get().activity] })
}

/* ---------------- approval ---------------- */
export async function saveApproval(on: boolean) {
  const { picks, tweaks, custom, film, notes, me } = get(); if (!film) return
  const a: Approval = { approved: on, picks: { ...picks }, tweaks, version: verName(), at: new Date().toISOString(), notesOpen: notes.filter(n => n.status !== 'done').length, by: me || '' }
  const doc = { ...a, custom }
  set({ approval: a }); ls.set(key('approval'), a)
  if (db) { try { await db.doc(`films/${film.id}/state/approval`).set(doc as unknown as Record<string, unknown>) } catch { toast.error('Approval saved in this browser only') } }
  toast.success(on ? `Approved ${a.version}. Claude builds it next.` : 'Approval withdrawn')
}

/* ---------------- ui ---------------- */
export function setView(v: View) { set({ view: v, mode: 'watch', draft: null, compare: null, drawer: false, peek: false, library: null, sheet: null }); if (get().film && v !== 'home') ls.set(key('view'), v) }
export function setSide(s: Side) { set({ side: s, drawer: true, peek: false }); ls.set('studio2:side', s) }
export const hasDb = () => !!db
export const ui = { set, get }
