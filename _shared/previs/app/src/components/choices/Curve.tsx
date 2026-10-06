import { easeFor } from '../../engine/viewer'
import type { Option } from '../../data/types'

/** A small graph of a motion feel: how far a moving thing has travelled over its move. Overshoot shows above the line. */
export function Curve({ o, w = 56, h = 30, className }: { o: Option; w?: number; h?: number; className?: string }) {
  const f = easeFor(o)
  const pts: string[] = []
  for (let i = 0; i <= 40; i++) { const x = i / 40, y = f(x); pts.push(`${(x * (w - 4) + 2).toFixed(1)},${(h - 4 - y * (h - 10)).toFixed(1)}`) }
  const top = h - 4 - (h - 10)
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden>
      <line x1={2} x2={w - 2} y1={top} y2={top} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="2 2" />
      <line x1={2} x2={w - 2} y1={h - 4} y2={h - 4} stroke="currentColor" strokeOpacity={0.25} />
      <polyline points={pts.join(' ')} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
