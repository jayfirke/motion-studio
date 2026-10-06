import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { FilmViewer } from '../../engine/viewer'
import { ui, useStudio } from '../../state/store'

/** One frame of one shot at local time u (seconds at pace 1), fitted to its box. Repaints when picks change. */
export function Still({ sceneId, u, className, onViewer }: { sceneId: string; u: number; className?: string; onViewer?: (v: FilmViewer | null) => void }) {
  const D = useStudio(s => s.M!.D)
  const C = useStudio(s => s.C)
  const box = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null)
  const v = useRef<FilmViewer | null>(null)
  const [scale, setScale] = useState(0.1)
  useEffect(() => {
    if (!host.current) return
    const vv = new FilmViewer(host.current, D, () => ui.get().C!)
    v.current = vv; vv.still(sceneId, u); onViewer?.(vv)
    return () => { onViewer?.(null); vv.destroy(); v.current = null }
  }, [D, sceneId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const vv = v.current; if (!vv) return; vv.look(); vv.still(sceneId, u) }, [C, sceneId, u])
  useLayoutEffect(() => {
    const el = box.current; if (!el) return
    const fit = () => setScale(el.clientWidth / D.project.w); fit()
    const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect()
  }, [D])
  return (
    <div ref={box} className={`relative overflow-hidden bg-black ${className || ''}`} style={{ aspectRatio: `${D.project.w} / ${D.project.h}` }}>
      <div ref={host} className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }} />
    </div>
  )
}
