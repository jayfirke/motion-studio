// Thin, typed access to the artifact runtime. Every capability may be missing (local preview, signed out,
// read-only viewer), so each call degrades instead of failing.

type Unsub = () => void
export interface DocSnap { id: string; exists: boolean; data(): Record<string, unknown> | undefined }
export interface QuerySnap { docs: DocSnap[] }
export interface DocRef { get(): Promise<DocSnap>; set(d: Record<string, unknown>): Promise<void>; update(d: Record<string, unknown>): Promise<void>; delete(): Promise<void>; onSnapshot(n: (s: DocSnap) => void, e?: (err: { code: string }) => void): Unsub }
export interface ColRef { doc(id?: string): DocRef; add(d: Record<string, unknown>): Promise<DocRef>; onSnapshot(n: (s: QuerySnap) => void, e?: (err: { code: string }) => void): Unsub }
export interface DB { doc(p: string): DocRef; collection(p: string): ColRef }
export interface User { id(): Promise<string | null>; isOwner(): Promise<boolean>; can(n: string): Promise<boolean | null> }
export interface SampleTool { name: string; description: string; inputSchema?: { type: 'object'; properties?: Record<string, unknown>; required?: string[] }; execute(input: Record<string, unknown>): unknown }
export interface SampleError { code: string; message: string; text?: string }
export interface Sample {
  (input: string | { role: 'user' | 'assistant'; content: string }[], opts?: { onText?: (u: { text: string }) => void; signal?: AbortSignal; modelTier?: 'quick' | 'default' | 'complex'; cache?: boolean; tools?: SampleTool[] }): Promise<{ text: string; truncated?: boolean }>
  limits(): Promise<{ tools?: { maxTools?: number } }>
  json<T = unknown>(input: string | { role: 'user' | 'assistant'; content: string }[], opts?: { onText?: (u: { text: string }) => void; signal?: AbortSignal; modelTier?: 'quick' | 'default' | 'complex'; cache?: boolean }): Promise<T>
}

interface ClaudeWin { claude?: { use(n: string): Promise<unknown> } }
const use = <T,>(n: string): Promise<T | null> => {
  const w = window as unknown as ClaudeWin
  if (!w.claude || !w.claude.use) return Promise.resolve(null)
  return Promise.race([w.claude.use(n) as Promise<T | null>, new Promise<null>(r => setTimeout(() => r(null), 11000))]).catch(() => null)
}

let dbP: Promise<DB | null> | null = null, userP: Promise<User | null> | null = null, sampleP: Promise<Sample | null> | null = null
export const getDb = () => (dbP ||= use<DB>('db'))
export const getUser = () => (userP ||= use<User>('user'))
export const getSample = () => (sampleP ||= use<Sample>('sample'))
export const hasRuntime = () => !!(window as unknown as ClaudeWin).claude
