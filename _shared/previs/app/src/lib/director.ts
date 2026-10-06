import { addOption, addRequest, setPick, ui } from '../state/store'
import { cleanText, libraryKind, optLabel } from '../data/model'
import type { Option } from '../data/types'
import { getSample } from './claude'
import { rank, words } from './match'
import { playback } from '../engine/playback'
import { tc } from './util'

// The "Ask the director" engine. The AI reads the plan and answers with a reply plus actions that the page
// carries out itself (pick, add from a library, design a new look or motion feel, write a new line, file a
// request for Claude Code, compare, play). Without AI it falls back to plain-words matching, so asking for
// "more colour options" or "something simple and sober" always does something.

export interface Turn { role: 'user' | 'assistant'; content: string }
export interface Done { label: string; key?: string; id?: string; kind: 'pick' | 'add' | 'request' | 'compare' | 'play' }
export interface DirResult { reply: string; done: Done[]; errors: string[]; ai: boolean }
type Action = Record<string, unknown> & { type: string }

/* ---------------- looks: fonts and contrast ---------------- */
export const DISPLAY_FONTS = ['Fraunces', 'Sora', 'Bricolage Grotesque', 'DM Serif Display', 'Playfair Display', 'Space Grotesk', 'Manrope', 'Outfit', 'Syne', 'Plus Jakarta Sans', 'Instrument Serif']
export const UI_FONTS = ['Inter', 'IBM Plex Sans', 'DM Sans', 'Manrope', 'Work Sans', 'Outfit', 'Figtree', 'Plus Jakarta Sans', 'Space Grotesk']
const AXES: Record<string, string | null> = { Fraunces: 'opsz,wght@9..144,500;9..144,600', 'DM Serif Display': null, 'Instrument Serif': null, 'Playfair Display': 'wght@500;600;700', Syne: 'wght@600;700', Sora: 'wght@500;600', 'Bricolage Grotesque': 'opsz,wght@12..96,500;12..96,600', 'Space Grotesk': 'wght@500;600;700' }
const SERIF = new Set(['Fraunces', 'DM Serif Display', 'Playfair Display', 'Instrument Serif'])
export function fontsUrl(families: string[]) {
  return 'https://fonts.googleapis.com/css2?' + [...new Set(families)].map(f => `family=${f.replace(/ /g, '+')}${AXES[f] === null ? '' : `:${AXES[f] || 'wght@400;500;600;700'}`}`).join('&') + '&display=swap'
}
const hex = (s: unknown) => (typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s) ? s.toUpperCase() : null)
const lum = (h: string) => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
export const contrast = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
const best = (bg: string) => (contrast('#111111', bg) >= contrast('#FFFFFF', bg) ? '#111111' : '#FFFFFF')

/** Turns an AI-proposed palette into a safe look: valid colours, readable text pairs, allowed fonts. */
export function makeLook(a: { name?: unknown; why?: unknown; tokens?: unknown; display?: unknown; ui?: unknown }): Option | null {
  const t = (a.tokens || {}) as Record<string, unknown>
  const bg = hex(t.bg), accent = hex(t.accent)
  if (!bg || !accent) return null
  const card = hex(t.card) || (lum(bg) > 0.5 ? '#FFFFFF' : '#F7F7F7')
  const pair = (fg: unknown, on: string, min = 4.5) => { const f = hex(fg); return f && contrast(f, on) >= min ? f : best(on) }
  const tokens: Record<string, string> = {
    bg, 'on-bg': pair(t['on-bg'], bg), card, 'on-card': pair(t['on-card'], card), paper: hex(t.paper) || card,
    accent, 'on-accent': pair(t['on-accent'], accent), line: hex(t.line) || (lum(card) > 0.5 ? '#E4E4E4' : '#333333'), frame: hex(t.frame) || '#111111',
  }
  tokens['on-paper'] = pair(t['on-paper'], tokens.paper)
  tokens.muted = pair(t.muted, card, 3)
  const display = DISPLAY_FONTS.includes(String(a.display)) ? String(a.display) : 'Manrope'
  const uiF = UI_FONTS.includes(String(a.ui)) ? String(a.ui) : 'Inter'
  tokens.display = `'${display}', ${SERIF.has(display) ? 'Georgia, serif' : 'Arial, sans-serif'}`
  tokens.ui = `'${uiF}', Arial, sans-serif`
  tokens.mono = "'IBM Plex Mono', Menlo, monospace"
  return { id: '', name: String(a.name || 'New look').slice(0, 40), pitch: String(a.why || '').slice(0, 200), why: String(a.why || '').slice(0, 200), tokens, fonts_url: fontsUrl([display, uiF, 'IBM Plex Mono']), tags: ['ai'] }
}
export function makeMotion(a: { name?: unknown; why?: unknown; spring?: unknown; bezier?: unknown }): Option | null {
  const sp = a.spring as { f?: number; d?: number } | undefined, bz = a.bezier as number[] | undefined
  const o: Option = { id: '', name: String(a.name || 'New motion feel').slice(0, 40), why: String(a.why || '').slice(0, 200), tags: ['ai'] }
  if (sp && isFinite(Number(sp.f)) && isFinite(Number(sp.d))) o.spring = { f: Math.min(14, Math.max(2, Number(sp.f))), d: Math.min(12, Math.max(3, Number(sp.d))) }
  else if (Array.isArray(bz) && bz.length === 4 && bz.every(n => isFinite(Number(n)))) o.bezier = bz.map(n => Math.min(1.5, Math.max(-0.5, Number(n)))) as [number, number, number, number]
  else return null
  return o
}

/* ---------------- the plan as text for the AI ---------------- */
function brief(): string {
  const { M, C, picks, notes } = ui.get(); if (!M || !C) return ''
  const D = M.D, L = D.libraries || {}
  const libLine = (k: string) => (L[k] || []).map(o => `${o.id}=${o.name}${o.tags ? ` [${o.tags.slice(0, 6).join(', ')}]` : ''}${o.lang ? ` (${o.accent}, ${o.gender})` : ''}`).join('; ')
  return [
    `Film: ${D.project.product}. ${D.project.feature} ${C.total.toFixed(1)} s, ${D.project.format}.`,
    `Tone: ${D.summary.tone} Audience: ${D.summary.audience}. Message: ${D.summary.message}`,
    '', 'DECISIONS (key: question | options id=name | [current] (recommended)):',
    ...M.ORDER.map(k => { const d = M.DEC[k]; return `- ${k}: ${d.q} | ${d.options.map(o => `${o.id}=${optLabel(o)}${picks[k] === o.id ? ' [current]' : ''}${d.chosen === o.id ? ' (recommended)' : ''}`).join('; ')}` }),
    '', 'LIBRARIES (add any item to the matching decision with {"type":"add"}):',
    ...['direction', 'music', 'motion', 'pacing', 'voice', 'camera', 'transition', 'sfx'].filter(k => (L[k] || []).length).map(k => `- ${k}: ${libLine(k)}`),
    '', 'VOICES IN DETAIL:', ...(L.voice || []).map(v => `- ${v.id}: ${v.name}, ${v.accent}, ${v.gender}. ${v.intro}`),
    '', 'SHOTS:', ...C.TL.map(r => `- ${r.sc.id} ${r.sc.name} (${tc(r.start)}–${tc(r.end)}): ${r.sc.purpose} Line: "${cleanText(C.o(`${r.sc.id}.vo`)?.text)}"`),
    notes.length ? '\nREVIEWER NOTES:\n' + notes.slice(0, 20).map(n => `- ${tc(n.t)} ${n.target}: ${n.text}`).join('\n') : '',
  ].filter(x => x !== '').join('\n')
}
const RULES = `You are the director of a short product film shown to a non-expert as a playable previs. You can change the film yourself.
Reply ONLY with JSON: {"reply": "...", "actions": [...]}.
"reply": 2–5 short plain sentences that say exactly what you did (or will have Claude Code do) and what to try next. Never only describe the existing three options.
Actions you can take:
- {"type":"pick","key":"music","option":"B"} switch a decision to an existing option.
- {"type":"add","key":"music","from":"fs679738","pick":true} add a library item (key may be a shot decision like "s2.camera").
- {"type":"add_look","name":"Sage paper","why":"...","tokens":{"bg":"#..","on-bg":"#..","card":"#..","on-card":"#..","muted":"#..","line":"#..","paper":"#..","on-paper":"#..","accent":"#..","on-accent":"#..","frame":"#.."},"display":"Fraunces","ui":"Inter","pick":false} design a new look. display fonts: ${DISPLAY_FONTS.join(', ')}. ui fonts: ${UI_FONTS.join(', ')}.
- {"type":"add_motion","name":"...","why":"...","spring":{"f":6,"d":7}} or with "bezier":[x1,y1,x2,y2]; keep overshoot under 4 % unless asked for playful.
- {"type":"add_line","scene":"s3","text":"new narration line","why":"..."} a new wording; it plays as a caption until Claude Code records it.
- {"type":"request","text":"..."} a job only Claude Code can do (new sound, new music outside the library, a new shot, a recording).
- {"type":"compare","key":"direction","options":["A","D","E"]} show options side by side (2–4).
- {"type":"play","key":"music"} play the moment that shows a decision.
When asked for "more" options, add 2–4 fitting ones (library first, then designed looks or motion), pick the best one if the reviewer asked to switch, and offer a compare. When asked which voices or languages exist, list them with a short intro each. Keep house rules: one accent colour, readable text, recorded foley, voice leads the mix.`

/* ---------------- executing actions ---------------- */
function libFor(key: string): Option[] {
  const { M } = ui.get(); if (!M) return []
  const d = M.DEC[key]; if (!d) return []
  const kind = libraryKind(d); return kind ? M.D.libraries?.[kind] || [] : []
}
export function addFromLibrary(key: string, item: Option, pick = false) {
  const copy: Option = { ...item, ref: item.id }
  return addOption(key, copy, { pick, origin: 'library' })
}
function execute(actions: Action[]): { done: Done[]; errors: string[]; compare?: { key: string; ids: string[] }; play?: string } {
  const { M } = ui.get(); const done: Done[] = [], errors: string[] = []
  let compare: { key: string; ids: string[] } | undefined, play: string | undefined
  if (!M) return { done, errors }
  for (const a of actions.slice(0, 12)) {
    try {
      const key = String(a.key || '')
      if (a.type === 'pick') {
        const d = ui.get().M!.DEC[key]; const o = d?.options.find(x => x.id === String(a.option))
        if (!o) { errors.push(`No option ${a.option} on ${key}`); continue }
        setPick(key, o.id); done.push({ kind: 'pick', label: `${d.q} → ${o.id} · ${optLabel(o)}`, key, id: o.id }); play ||= key
      } else if (a.type === 'add') {
        const item = libFor(key).find(x => x.id === String(a.from))
        if (!item) { errors.push(`No library item ${a.from} for ${key}`); continue }
        const id = addFromLibrary(key, item, !!a.pick)
        if (id) { done.push({ kind: 'add', label: `${ui.get().M!.DEC[key].q} + ${id} · ${item.name}${a.pick ? ' (picked)' : ''}`, key, id }); if (a.pick) play ||= key }
      } else if (a.type === 'add_look') {
        const o = makeLook(a as Parameters<typeof makeLook>[0]); if (!o) { errors.push('A look was missing colours'); continue }
        const id = addOption('direction', o, { pick: !!a.pick, origin: 'ai' })
        if (id) { done.push({ kind: 'add', label: `Which look? + ${id} · ${o.name}${a.pick ? ' (picked)' : ''}`, key: 'direction', id }); if (a.pick) play ||= 'direction' }
      } else if (a.type === 'add_motion') {
        const o = makeMotion(a as Parameters<typeof makeMotion>[0]); if (!o) { errors.push('A motion feel had no curve'); continue }
        const id = addOption('motion', o, { pick: !!a.pick, origin: 'ai' })
        if (id) { done.push({ kind: 'add', label: `How should things move? + ${id} · ${o.name}${a.pick ? ' (picked)' : ''}`, key: 'motion', id }); if (a.pick) play ||= 'motion' }
      } else if (a.type === 'add_line') {
        const sc = String(a.scene || ''), k = `${sc}.vo`, d = ui.get().M!.DEC[k], text = String(a.text || '').slice(0, 140)
        if (!d || !text) { errors.push(`No shot ${sc}`); continue }
        const base = d.options.find(o => o.id === d.chosen)!
        const id = addOption(k, { id: '', name: text, text, why: String(a.why || ''), at: base.at, dur: Math.max(1, text.split(/\s+/).length / 2.8), needs: 'voice take' }, { origin: 'ai' })
        addRequest(`Record the new line for ${sc} (option ${id}): "${text}" in the current voice.`, sc)
        done.push({ kind: 'add', label: `${d.q} + ${id} · “${text}” (Claude Code records it)`, key: k, id: id || undefined })
      } else if (a.type === 'request') {
        const text = String(a.text || '').slice(0, 600); if (!text) continue
        addRequest(text); done.push({ kind: 'request', label: `Request for Claude Code: ${text.slice(0, 80)}` })
      } else if (a.type === 'compare') {
        const d = ui.get().M!.DEC[key]; const ids = (Array.isArray(a.options) ? a.options.map(String) : []).filter(id => d?.options.some(o => o.id === id)).slice(0, 4)
        if (d && ids.length >= 2) { compare = { key, ids }; done.push({ kind: 'compare', label: `Compare ${d.q} ${ids.join(' · ')}`, key }) }
      } else if (a.type === 'play') { if (ui.get().M!.DEC[key]) play = key }
    } catch (e) { errors.push(String((e as Error).message)) }
  }
  return { done, errors, compare, play }
}

/* ---------------- offline director ---------------- */
const KIND_WORDS: [string, RegExp][] = [
  ['direction', /\bcolou?rs?\b|\blooks?\b|palette|\btheme\b|\bstyle\b|visual/i],
  ['music', /music|\bsongs?\b|\btracks?\b|\bbeds?\b|soundtrack|\bbeats?\b|bgm/i],
  ['voice', /voice|narrat|speaker|accent|language|hindi|english|\bsarah\b|\bmale\b|\bfemale\b/i],
  ['motion', /motion|animat|movement|\bmoves?\b|\bease\b|\beasing\b|\bspring|bounc/i],
  ['pacing', /\bpace\b|pacing|\bspeed\b|faster|slower|shorter|longer/i],
]
function offline(q: string, scope?: string): { reply: string; actions: Action[] } {
  const { M } = ui.get(); if (!M) return { reply: 'The film is still loading.', actions: [] }
  const kinds = scope ? [scope] : KIND_WORDS.filter(([, re]) => re.test(q)).map(([k]) => k)
  const asksList = /\b(which|what|list|available|have|show me)\b/i.test(q) && /voice|language/i.test(q) && !/more|add|switch|change|use/i.test(q)
  if (asksList) {
    const vs = M.D.libraries?.voice || []
    const langs = [...new Set(vs.map(v => v.accent))].join(', ')
    return { reply: `There are ${vs.length} voices in ${langs}:\n` + vs.map(v => `• ${v.name} (${v.accent}, ${v.gender}): ${v.intro}`).join('\n') + '\n\nSay "use the Hindi narrator" or open Which voice? → More options to add any of them.', actions: [] }
  }
  if (!kinds.length) return { reply: 'I can add more looks, music, motion feels, pacing and voices from the library, switch any choice, or file a job for Claude Code. Try "more colour options", "music that is simple and sober" or "which voices do you have?".', actions: [] }
  const actions: Action[] = []; const said: string[] = []
  const wantSwitch = /\b(use|switch|change|set|make it|i want|prefer|go with)\b/i.test(q)
  kinds.forEach(kind => {
    const key = kind
    const d = M.DEC[key]; if (!d) return
    const have = new Set(d.options.map(o => o.ref || o.id))
    const pool = (M.D.libraries?.[kind] || []).filter(o => !have.has(o.id))
    if (!pool.length) { said.push(`${d.q} already has every library option.`); return }
    const ranked = rank(q, pool); const hits = ranked.filter(r => r.score > 0)
    const ws = words(q).join(' ')
    // "Use a Hindi narrator": if an option already on the card fits as well as anything in the library, switch to it.
    const onCard = rank(q, d.options).filter(r => r.score > 0)[0]
    if (wantSwitch && onCard && (!hits.length || onCard.score >= hits[0].score)) {
      actions.push({ type: 'pick', key, option: onCard.o.id })
      hits.slice(0, 2).forEach(r => actions.push({ type: 'add', key, from: r.o.id, pick: false }))
      said.push(`Switched “${d.q}” to ${onCard.o.id} · ${optLabel(onCard.o)}${hits.length ? `, and added ${hits.slice(0, 2).map(r => r.o.name).join(' and ')} as alternatives` : ''}.`)
      return
    }
    const take = (hits.length ? hits : ranked).slice(0, 3)
    take.forEach((r, i) => actions.push({ type: 'add', key, from: r.o.id, pick: wantSwitch && i === 0 && hits.length > 0 }))
    said.push(`Added ${take.map(r => r.o.name).join(', ')} to “${d.q}”${hits.length && ws ? `, the closest matches for “${ws}”` : ''}${wantSwitch && hits.length ? `, and switched to ${take[0].o.name}` : ''}.`)
  })
  return { reply: said.join(' ') + ' Press “Play this moment” on the card, or Compare to see them side by side.', actions }
}

/* ---------------- run ---------------- */
export async function runDirector(question: string, history: Turn[] = [], scope?: string, signal?: AbortSignal, onText?: (t: string) => void, wish?: string): Promise<DirResult> {
  const sample = await getSample()
  let reply = '', actions: Action[] = [], ai = false
  if (sample?.json) {
    try {
      const scoped = scope ? `\nThe reviewer is looking at the decision "${scope}". Act on that decision.` : ''
      const input = [{ role: 'user' as const, content: `${RULES}${scoped}\n\nTHE PLAN\n${brief()}` }, ...history.slice(-8), { role: 'user' as const, content: question }]
      const r = await sample.json<{ reply?: string; actions?: Action[] }>(input, { signal, modelTier: 'default', onText: onText ? u => onText(u.text) : undefined })
      reply = String(r?.reply || ''); actions = Array.isArray(r?.actions) ? r.actions.filter(a => a && typeof a.type === 'string') : []; ai = true
    } catch (e) {
      const code = (e as { code?: string })?.code
      if (code === 'cancelled') throw e
      const o = offline(wish ?? question, scope); reply = o.reply; actions = o.actions
    }
  } else { const o = offline(wish ?? question, scope); reply = o.reply; actions = o.actions }
  const r = execute(actions)
  if (r.compare) { ui.set({ compare: { key: r.compare.key, ids: r.compare.ids, hear: 0 }, view: 'watch', mode: 'watch' }) }
  if (r.play && ui.get().prefs.replay) setTimeout(() => { const { M, C } = ui.get(); if (!M || !C || ui.get().view !== 'watch') return; import('../data/model').then(m => { const [a, b] = m.momentOf(M, C, r.play!, C.at(ui.get().T)); playback.play(a, b) }) }, 120)
  return { reply: reply || (r.done.length ? 'Done.' : 'I could not change anything for that. Try naming the look, music, voice or motion you want.'), done: r.done, errors: r.errors, ai }
}
