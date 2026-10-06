// The previs data contract. A film is one previs.json plus its audio files; the app never changes per film.

export type Tokens = Record<string, string>
export type Pair = [number, number]

export interface CamMove { s?: Pair; x?: Pair; y?: Pair; origin?: string }

export interface Option {
  id: string
  name?: string
  text?: string
  why?: string
  src?: string | null
  gain?: number
  dur?: number
  at?: number
  copy?: string
  type?: 'cut' | 'push' | 'slide' | 'zoom' | 'iris' | string
  d?: number
  cam?: CamMove
  ease?: string
  scale?: number
  bpm?: number
  phase?: number
  lic?: string
  tokens?: Tokens
  pitch?: string
  tradeoff?: string
  energy?: number[]
  /** Where the option came from: the director's three, a library, the AI director, or the reviewer. */
  origin?: 'director' | 'library' | 'ai' | 'you'
  /** The library item an added option copies (prevents adding it twice). */
  ref?: string
  tags?: string[]
  level?: string
  /** Motion feels: a named ease, a damped spring, or a cubic bezier. */
  spring?: { f: number; d: number }
  bezier?: [number, number, number, number]
  /** Looks: extra web fonts this look needs. */
  fonts_url?: string
  /** Voices. */
  lang?: string
  accent?: string
  gender?: string
  intro?: string
  sample?: string
  voice?: string
  dir?: string
  durs?: Record<string, number>
  texts?: Record<string, string>
  /** Work only Claude Code can do before this option is real (for example a voice take). */
  needs?: string
}

export interface Decision { label?: string; chosen: string; options: Option[] }

export interface Sfx extends Decision { id: string; label: string; at: number | number[]; hit?: boolean; step?: number; why?: string }

export interface Anim {
  s: string
  t?: Pair
  f?: Record<string, number>
  to?: Record<string, number>
  e?: string
  set?: string
  at?: number
  until?: number
  count?: Pair
  d?: number
  p?: string
}

export interface Engine { name?: string; why?: string; alt?: string; fallback?: string }

export interface Scene {
  id: string
  name: string
  dur: number
  truth?: string
  levels?: number
  purpose: string
  copy?: string
  notes?: Record<string, string>
  html: string
  anim?: Anim[]
  decisions?: Record<string, Decision>
  sfx?: Sfx[]
  engine?: Engine
  key?: number
}

export interface Director { id: string; group: string; name: string; active: boolean; owns?: string[]; summary: string; why: string }

export interface Previs {
  project: { id: string; product: string; fictional?: boolean; feature: string; format: string; w: number; h: number; fps?: number; engine?: string; status?: string }
  summary: { tone: string; audience: string; message: string; arc?: string }
  directions: { chosen: string; options: Option[] }
  global: Record<string, Decision>
  engine?: Engine
  references?: { name: string; borrow: string; avoid: string; scenes?: string }[]
  style_rules?: Record<string, string>
  audio_notes?: string[]
  qa?: { level: string; text: string }[]
  versions?: { v: string; date: string; note: string }[]
  film_css?: string
  fonts_url?: string
  scenes: Scene[]
  chief?: { objective?: string; thesis?: string; feeling?: string; depth?: string }
  story?: { beat: string; scene: string; viewer: string }[]
  directors?: Director[]
  assets?: { name: string; kind?: string; source: string; licence: string; truth?: string }[]
  gates?: { name: string; covers: string }[]
  pipeline?: { engine?: string; steps: string[]; formats?: string; estimate?: string }
  changes?: { v: string; target: string; change: string; reason?: string }[]
  /** Options the reviewer can add on top of the director's three, by decision kind. */
  libraries?: Partial<Record<'direction' | 'music' | 'motion' | 'pacing' | 'camera' | 'transition' | 'sfx' | 'voice' | string, Option[]>>
  risks?: { level: string; text: string }[]
}

export interface FilmRef { id: string; name?: string; path: string }

export type Picks = Record<string, string>
export interface Tweak { dt?: number; db?: number; on?: boolean }
export type Tweaks = Record<string, Tweak>

export interface Stroke { tool: 'pen' | 'arrow' | 'box'; pts: Pair[] }
export interface Box { x: number; y: number; w: number; h: number }
export interface Reply { by: 'you' | 'claude' | string; text: string; at: string }

export type NoteCategory = 'look' | 'motion' | 'sound' | 'voice' | 'copy' | 'story' | 'other'
/** Claude Code's progress on a note, written by Claude when it works through the notes. */
export interface ClaudeMark { state: 'seen' | 'working' | 'done' | 'question' | 'wontfix'; at: string; msg?: string }

export interface Note {
  id: string
  t: number
  t2?: number | null
  kind: 'frame' | 'region' | 'range' | 'sound' | 'shot' | 'revert' | 'request'
  target: string
  targets?: string[]
  key?: string
  x?: number | null
  y?: number | null
  box?: Box | null
  strokes?: Stroke[]
  quick?: string[]
  text: string
  scene: string
  picks?: Picks
  version?: string
  status: 'open' | 'done'
  reply?: string
  replies?: Reply[]
  by?: string
  at?: string
  local?: boolean
  category?: NoteCategory
  priority?: 'must' | 'nice'
  /** A change request or a question for Claude. */
  intent?: 'change' | 'question'
  /** "I prefer this option" link. */
  prefer?: { key: string; id: string } | null
  claude?: ClaudeMark | null
  edited?: string
  /** When the reviewer sent this note to Claude Code. */
  sent?: string
}

/** Claude Code's live status for a film (doc films/<id>/state/claude). */
export interface ClaudeStatus { state: 'idle' | 'reading' | 'working' | 'publishing' | 'waiting'; at: string; message?: string; version?: string; open?: number }
/** One line in the activity feed (collection films/<id>/activity). */
export interface Activity { id: string; at: string; by: 'claude' | 'you' | string; kind: 'seen' | 'applied' | 'published' | 'question' | 'note' | 'info' | string; text: string; noteIds?: string[]; version?: string }

/** A free note about the whole film (an idea, a reminder, a decision). Claude reads notes as background, never as change requests. */
export interface PadNote { id: string; text: string; at: string; by?: string; who?: 'you' | 'claude'; local?: boolean }

export interface Approval { approved: boolean; picks: Picks; tweaks: Tweaks; version: string; at: string; notesOpen: number; by?: string }
