import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowRight, Film } from 'lucide-react'
import { fetchFilm, openFilm, useStudio } from '../../state/store'
import { validatePrevis } from '../../data/schema'
import { buildModel, makeCtx } from '../../data/model'
import { FilmViewer } from '../../engine/viewer'
import type { FilmRef, Previs } from '../../data/types'
import { Empty } from '../ui'
import { store as ls } from '../../lib/util'

/** Every film in the studio, each with a live poster from its own data. */
export function Home() {
  const films = useStudio(s => s.films)
  return (
    <div className="h-full min-w-0 flex-1 overflow-y-auto" data-testid="home">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8">
        <h1 className="text-[28px] font-bold leading-tight">Films</h1>
        <p className="mt-1 max-w-[60ch] text-[14.5px] text-muted">Each film here is a plan, not a render yet. Open one, watch it, change what you like, leave comments, then approve it so Claude builds the real video.</p>
        {!films.length ? <Empty icon={<Film size={28} />} title="No films yet">Claude adds a film here after it plans one.</Empty> : (
          <ul className="mt-6 grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))' }}>
            {films.map(f => <FilmCard key={f.id} f={f} />)}
          </ul>
        )}
      </div>
    </div>
  )
}

function FilmCard({ f }: { f: FilmRef }) {
  const [D, setD] = useState<Previs | null>(null)
  const [bad, setBad] = useState(false)
  const box = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.2)
  useEffect(() => { fetchFilm(f).then(raw => { const v = validatePrevis(raw); if (v.ok) setD(v.data); else setBad(true) }).catch(() => setBad(true)) }, [f])
  useEffect(() => {
    if (!D || !host.current) return
    const M = buildModel(D), C = makeCtx(M, M.DIRECTOR, {})
    const v = new FilmViewer(host.current, D, () => C)
    const sc = D.scenes[0]; v.still(sc.id, sc.key ?? sc.dur * 0.6)
    return () => v.destroy()
  }, [D])
  useLayoutEffect(() => { const el = box.current; if (!el || !D) return; const fit = () => setScale(el.clientWidth / D.project.w); fit(); const ro = new ResizeObserver(fit); ro.observe(el); return () => ro.disconnect() }, [D])
  const appr = ls.get<{ approved: boolean; version: string }>(`studio2:${f.id}:approval`)
  return (
    <li>
      <button type="button" onClick={() => openFilm(f)} className="card group flex w-full flex-col overflow-hidden text-left transition-colors hover:border-line2" data-film-card={f.id}>
        <div ref={box} className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: D ? `${D.project.w} / ${D.project.h}` : '9 / 16', maxHeight: 420 }}>
          <div ref={host} className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${scale})` }} />
          {bad && <span className="absolute inset-0 grid place-items-center text-[13px] text-muted">Could not load this film</span>}
        </div>
        <div className="flex flex-col gap-1 p-3.5">
          <div className="flex items-center gap-2"><b className="flex-1 truncate text-[16px]">{f.name || D?.project.product || f.id}</b>{appr?.approved ? <span className="tag tag-mint">Approved {appr.version}</span> : <span className="tag tag-amber">In review</span>}</div>
          {D && <p className="line-clamp-2 text-[13px] leading-snug text-muted">{D.project.feature}</p>}
          <span className="mt-1 flex items-center gap-1 text-[13px] font-semibold text-sky">Open<ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
        </div>
      </button>
    </li>
  )
}
