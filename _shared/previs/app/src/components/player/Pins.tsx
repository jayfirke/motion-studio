import { useStudio, ui } from '../../state/store'
import { StrokeSvg } from './CommentLayer'
import { playback } from '../../engine/playback'

/** Notes drawn on the frame near their moment: numbered pins, boxes and drawings. */
export function Pins() {
  const notes = useStudio(s => s.notes)
  const T = useStudio(s => s.T)
  const draft = useStudio(s => s.draft)
  const sel = useStudio(s => s.selNote)
  const compare = useStudio(s => s.compare)
  if (compare) return null
  const near = notes.filter(n => (n.kind === 'frame' || n.kind === 'region') && Math.abs(n.t - T) < 0.6)
  const select = (id: string, t: number) => { ui.set({ selNote: id, side: 'notes', drawer: true }); playback.seek(t) }
  return (
    <div className="pointer-events-none absolute inset-0 z-[4]">
      {near.map(n => {
        const num = notes.indexOf(n) + 1, done = n.status === 'done', on = sel === n.id
        return (
          <div key={n.id}>
            {n.box && <div className={`absolute rounded-[4px] border-2 ${done ? 'border-mint' : 'border-ember'} ${on ? 'bg-ember/15' : ''}`} style={{ left: `${n.box.x * 100}%`, top: `${n.box.y * 100}%`, width: `${n.box.w * 100}%`, height: `${n.box.h * 100}%` }} />}
            {!!n.strokes?.length && <StrokeSvg strokes={n.strokes} dim={!on} />}
            {n.x != null && n.y != null && (
              <button type="button" className={`pointer-events-auto absolute -ml-1 -mt-7 grid h-7 min-w-7 place-items-center rounded-[14px_14px_14px_3px] border-2 border-white px-1.5 text-[12px] font-extrabold shadow-lg ${done ? 'bg-mint text-mint-ink' : 'bg-ember text-ember-ink'} ${on ? 'scale-110' : ''}`}
                style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }} title={`${n.target}: ${n.text}`} aria-label={`Comment ${num}: ${n.text}`} onClick={e => { e.stopPropagation(); select(n.id, n.t) }}>{num}</button>
            )}
          </div>
        )
      })}
      {draft && (
        <>
          {draft.box && <div className="absolute rounded-[4px] border-2 border-dashed border-ember bg-ember/10" style={{ left: `${draft.box.x * 100}%`, top: `${draft.box.y * 100}%`, width: `${draft.box.w * 100}%`, height: `${draft.box.h * 100}%` }} />}
          {draft.strokes.length > 0 && <StrokeSvg strokes={draft.strokes} />}
          {draft.kind === 'frame' && draft.x != null && <div className="absolute -ml-1 -mt-7 grid h-7 w-7 place-items-center rounded-[14px_14px_14px_3px] border-2 border-white bg-ember text-[13px] font-extrabold text-ember-ink pulse" style={{ left: `${draft.x * 100}%`, top: `${(draft.y || 0) * 100}%` }}>+</div>}
        </>
      )}
    </div>
  )
}
