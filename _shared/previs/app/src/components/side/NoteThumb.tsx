import { useEffect, useRef, useState } from 'react'
import { FilmViewer } from '../../engine/viewer'
import { StrokeSvg } from '../player/CommentLayer'
import { ui, useStudio } from '../../state/store'
import type { Note } from '../../data/types'

/** A small still of the frame a note points at, with its box and drawing. Built only when it scrolls into view. */
export function NoteThumb({ n, w = 64 }: { n: Note; w?: number }) {
  const D = useStudio(s => s.M!.D)
  const C = useStudio(s => s.C)
  const box = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null)
  const v = useRef<FilmViewer | null>(null)
  const [seen, setSeen] = useState(false)
  const s = w / D.project.w, h = D.project.h * s
  useEffect(() => {
    const el = box.current; if (!el) return
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setSeen(true); io.disconnect() } }, { rootMargin: '120px' })
    io.observe(el); return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!seen || !host.current) return
    v.current = new FilmViewer(host.current, D, () => ui.get().C!)
    return () => { v.current?.destroy(); v.current = null }
  }, [seen, D])
  useEffect(() => { const x = v.current; if (!x) return; x.look(); x.paint(n.t) }, [seen, C, n.t])
  return (
    <div ref={box} className="relative shrink-0 overflow-hidden rounded-[6px] bg-black" style={{ width: w, height: h }} aria-hidden>
      <div ref={host} className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${s})` }} />
      {n.box && <div className="absolute border-[1.5px] border-ember" style={{ left: `${n.box.x * 100}%`, top: `${n.box.y * 100}%`, width: `${n.box.w * 100}%`, height: `${n.box.h * 100}%` }} />}
      {!!n.strokes?.length && <StrokeSvg strokes={n.strokes} />}
      {n.x != null && n.y != null && !n.box && <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-ember" style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }} />}
    </div>
  )
}
