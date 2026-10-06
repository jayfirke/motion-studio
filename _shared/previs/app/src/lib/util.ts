export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const tc = (t: number) => { t = Math.max(0, t); const m = Math.floor(t / 60); return `${m}:${(t - m * 60).toFixed(1).padStart(4, '0')}` }
export const tcFine = (t: number, fps = 30) => { t = Math.max(0, t); const m = Math.floor(t / 60), s = Math.floor(t - m * 60), f = Math.round((t - Math.floor(t)) * fps) % fps; return `${m}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}` }
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')
export const store = {
  get<T>(k: string): T | null { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null } catch { return null } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage blocked */ } },
}
export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
export const modKey = isMac ? '⌘' : 'Ctrl'
export const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
/** Pointer capture keeps a drag going when the pointer leaves the element. Some synthetic or already-ended pointers cannot be captured; dragging still works without it. */
export const capture = (el: Element | null | undefined, id: number) => { try { el?.setPointerCapture(id) } catch { /* not capturable */ } }
