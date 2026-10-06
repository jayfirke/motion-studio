import { z } from 'zod'
import type { Previs } from './types'

// Validates a film's data before the app touches it, and turns problems into plain sentences.
const option = z.object({ id: z.string().min(1) }).passthrough()
const decision = z.object({ chosen: z.string(), options: z.array(option).min(1) }).passthrough()
const sfx = decision.extend({ id: z.string(), label: z.string(), at: z.union([z.number(), z.array(z.number()).min(1)]) })
const anim = z.object({ s: z.string() }).passthrough()
const scene = z.object({
  id: z.string(), name: z.string(), dur: z.number().positive(), purpose: z.string(), html: z.string(),
  anim: z.array(anim).optional(), decisions: z.record(z.string(), decision).optional(), sfx: z.array(sfx).optional(),
}).passthrough()
const previs = z.object({
  project: z.object({ id: z.string(), product: z.string(), feature: z.string(), format: z.string(), w: z.number().positive(), h: z.number().positive() }).passthrough(),
  summary: z.object({ tone: z.string(), audience: z.string(), message: z.string() }).passthrough(),
  directions: z.object({ chosen: z.string(), options: z.array(option.extend({ tokens: z.record(z.string(), z.string()) })).min(1) }).passthrough(),
  global: z.record(z.string(), decision),
  scenes: z.array(scene).min(1),
}).passthrough()

export function validatePrevis(raw: unknown): { ok: true; data: Previs } | { ok: false; problems: string[] } {
  const r = previs.safeParse(raw)
  if (r.success) {
    const d = r.data as unknown as Previs
    const problems: string[] = []
    const check = (where: string, dec: { chosen: string; options: { id: string }[] }) => { if (!dec.options.some(o => o.id === dec.chosen)) problems.push(`${where}: the recommended option "${dec.chosen}" is not one of its options.`) }
    check('Direction', d.directions)
    Object.entries(d.global).forEach(([k, v]) => check(k, v))
    d.scenes.forEach((sc, i) => {
      Object.entries(sc.decisions || {}).forEach(([k, v]) => check(`Shot ${i + 1} ${k}`, v))
      ;(sc.sfx || []).forEach(x => check(`Shot ${i + 1} sound "${x.label}"`, x))
    })
    return problems.length ? { ok: false, problems } : { ok: true, data: d }
  }
  return { ok: false, problems: r.error.issues.slice(0, 8).map(i => `${i.path.join(' → ') || 'file'}: ${i.message}`) }
}
