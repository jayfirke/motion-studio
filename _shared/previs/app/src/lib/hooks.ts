import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'

/** Live media-query match. */
export function useMedia(q: string) {
  return useSyncExternalStore(
    cb => { const m = matchMedia(q); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb) },
    () => matchMedia(q).matches,
    () => false,
  )
}
/** Side panel docks beside the player at this width; below it the panel becomes a drawer. */
export const useWide = () => useMedia('(min-width: 1080px)')
export const usePhone = () => useMedia('(max-width: 639px)')
export const useCoarse = () => useMedia('(pointer: coarse)')

/** Width of an element, kept current. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** Runs `fn` when a click lands outside every element in `refs`. */
export function useOutside(refs: React.RefObject<HTMLElement | null>[], fn: () => void, on = true) {
  useEffect(() => {
    if (!on) return
    const h = (e: PointerEvent) => { if (refs.every(r => !r.current || !r.current.contains(e.target as Node))) fn() }
    const id = window.setTimeout(() => document.addEventListener('pointerdown', h), 0)
    return () => { window.clearTimeout(id); document.removeEventListener('pointerdown', h) }
  })
}
