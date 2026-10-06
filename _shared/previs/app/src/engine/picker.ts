import type { FilmViewer } from './viewer'
import type { Box } from '../data/types'

// Finds what a reviewer is pointing at inside the film frame: from the smallest part (a chip, a price,
// a button) up to the whole phone, so tiny components are always selectable.

export interface Cand { el: HTMLElement; label: string; area: number; named: boolean }

const directText = (el: HTMLElement) => Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent || '').join(' ').replace(/\s+/g, ' ').trim()
const short = (s: string, n = 28) => (s.length > n ? s.slice(0, n - 1) + '…' : s)

export function labelOf(el: HTMLElement): string {
  if (el.dataset.name) return el.dataset.name
  const own = directText(el)
  const named = el.parentElement?.closest<HTMLElement>('[data-name]')
  const ctx = named && named.dataset.name ? ` in ${named.dataset.name}` : ''
  if (own) return `“${short(own)}”${ctx}`
  const all = (el.textContent || '').replace(/\s+/g, ' ').trim()
  if (all && all.length <= 40) return `“${short(all)}”${ctx}`
  const cls = Array.from(el.classList).find(c => c.startsWith('f-'))
  const friendly: Record<string, string> = { 'f-ch': 'Chip', 'f-av': 'Avatar', 'f-ring': 'Finger', 'f-isl': 'Camera notch', 'f-sb': 'Status bar', 'f-scr': 'Screen', 'f-fill': 'Bar fill', 'f-bar': 'Bar', 'f-br': 'Viewfinder frame' }
  return (cls && friendly[cls] ? friendly[cls] : 'Shape') + ctx
}

function meaningful(el: HTMLElement, frameArea: number): boolean {
  const r = el.getBoundingClientRect(), a = r.width * r.height
  if (a < 30) return false
  if (el.dataset.name) return true
  if (directText(el)) return true
  return a < frameArea * 0.6 && el.children.length <= 6 && (getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)' || getComputedStyle(el).borderStyle !== 'none')
}

/** Everything under the pointer, smallest first. */
export function candidatesAt(v: FilmViewer, x: number, y: number): Cand[] {
  const wrap = v.visibleScene(); if (!wrap) return []
  const fr = v.host.getBoundingClientRect(), frameArea = fr.width * fr.height
  const hits = document.elementsFromPoint(x, y).filter(h => wrap.contains(h) && h !== wrap && !(h as HTMLElement).classList.contains('fcam')) as HTMLElement[]
  const seen = new Set<HTMLElement>(), out: Cand[] = []
  const consider = (el: HTMLElement) => {
    if (seen.has(el) || el === wrap || el.classList.contains('fcam')) return
    seen.add(el)
    const vis = getComputedStyle(el)
    if (vis.visibility === 'hidden' || vis.display === 'none' || Number(vis.opacity) < 0.05) return
    if (!meaningful(el, frameArea)) return
    const r = el.getBoundingClientRect()
    out.push({ el, label: labelOf(el), area: r.width * r.height, named: !!el.dataset.name })
  }
  hits.forEach(h => { let e: HTMLElement | null = h; while (e && e !== wrap) { consider(e); e = e.parentElement } })
  const byRect = new Map<string, Cand>()
  out.forEach(c => { const r = c.el.getBoundingClientRect(); const k = [r.left, r.top, r.width, r.height].map(n => Math.round(n)).join(','); const prev = byRect.get(k); if (!prev || (c.named && !prev.named)) byRect.set(k, c) })
  return Array.from(byRect.values()).sort((a, b) => a.area - b.area)
}

/** What a dragged box covers: the parts mostly inside it, biggest meaningful ones first. */
export function insideBox(v: FilmViewer, box: Box): string[] {
  const wrap = v.visibleScene(); if (!wrap) return []
  const fr = v.host.getBoundingClientRect(), frameArea = fr.width * fr.height
  const bx = { l: fr.left + box.x * fr.width, t: fr.top + box.y * fr.height, r: fr.left + (box.x + box.w) * fr.width, b: fr.top + (box.y + box.h) * fr.height }
  const boxArea = (bx.r - bx.l) * (bx.b - bx.t)
  const found: { label: string; area: number; named: boolean; el: HTMLElement }[] = []
  wrap.querySelectorAll<HTMLElement>('*').forEach(el => {
    if (el.classList.contains('fcam')) return
    const r = el.getBoundingClientRect(), a = r.width * r.height
    if (a < 30 || a > boxArea * 1.6) return
    const iw = Math.max(0, Math.min(r.right, bx.r) - Math.max(r.left, bx.l)), ih = Math.max(0, Math.min(r.bottom, bx.b) - Math.max(r.top, bx.t))
    if ((iw * ih) / a < 0.6) return
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return
    if (!meaningful(el, frameArea)) return
    found.push({ label: labelOf(el), area: a, named: !!el.dataset.name, el })
  })
  // keep the outermost meaningful parts: drop anything inside an element already listed
  const kept = found.sort((a, b) => b.area - a.area).filter((c, i, arr) => !arr.slice(0, i).some(p => p.el.contains(c.el) && p.named))
  const labels: string[] = []
  kept.sort((a, b) => Number(b.named) - Number(a.named) || b.area - a.area).forEach(c => { if (!labels.includes(c.label)) labels.push(c.label) })
  return labels.slice(0, 6)
}

/** Ancestors with names, outermost first, for a breadcrumb like "Phone › Dish: Burrata". */
export function crumbs(el: HTMLElement, stop: HTMLElement): string[] {
  const out: string[] = []
  let e: HTMLElement | null = el.parentElement
  while (e && e !== stop) { if (e.dataset.name) out.unshift(e.dataset.name); e = e.parentElement }
  return out
}
