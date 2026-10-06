import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, BadgeCheck, CheckCircle2, CircleSlash, Clipboard, Download, Search, Send, Sparkles, Undo2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { addNote, setPick, setSide, setView, ui, useStudio } from '../../state/store'
import { beatOffsetMs, cleanText, optLabel, qaChecks } from '../../data/model'
import { playback } from '../../engine/playback'
import { addFromLibrary } from '../../lib/director'
import { currentSpec } from '../../lib/spec'
import { Curve } from '../choices/Curve'
import { Preview, tryMoment } from '../choices/ChoiceCard'
import { CATS } from '../side/NotesPanel'
import { Tip } from '../ui'
import { cx, tc } from '../../lib/util'

const GROUPS: { name: string; items: [string, string][] }[] = [
  { name: 'Film', items: [['overview', 'Overview'], ['brief', 'Brief'], ['story', 'Story'], ['script', 'Script'], ['shots', 'Shot list']] },
  { name: 'Look and motion', items: [['look', 'Look'], ['motion', 'Motion and camera'], ['refs', 'References']] },
  { name: 'Sound', items: [['sound', 'Music and sounds'], ['voice', 'Voice and cast']] },
  { name: 'People', items: [['team', 'Director team']] },
  { name: 'Production', items: [['assets', 'Assets'], ['build', 'Production'], ['gates', 'Approvals'], ['checks', 'Checks'], ['risks', 'Risks']] },
  { name: 'Review', items: [['notes', 'Notes'], ['versions', 'Versions'], ['export', 'Export spec']] },
]
const ALL = GROUPS.flatMap(g => g.items)

/** The production plan behind the previs, from the brief to an exportable spec. */
export function Plan() {
  const M = useStudio(s => s.M)!
  const C = useStudio(s => s.C)!
  const picks = useStudio(s => s.picks)
  const notes = useStudio(s => s.notes)
  const approval = useStudio(s => s.approval)
  const D = M.D
  const scroller = useRef<HTMLDivElement>(null)
  const [act, setAct] = useState('overview')
  const [find, setFind] = useState('')
  const checks = useMemo(() => qaChecks(M, C), [M, C])
  const look = C.o('direction'), music = C.o('music'), motion = C.o('motion'), voice = C.o('voice')
  const jump = (id: string) => { scroller.current?.querySelector(`#plan-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setAct(id) }
  const watchAt = (t: number) => { setView('watch'); requestAnimationFrame(() => playback.seek(t)) }
  const badge: Record<string, number> = { checks: checks.filter(c => c.level !== 'ok').length, notes: notes.filter(n => n.status !== 'done').length, risks: checks.filter(c => c.level === 'bad').length + (D.risks?.length || 0) }
  const ownerPicks = (owns?: string[]) => {
    if (!owns) return []
    const out: string[] = []
    owns.forEach(o => M.ORDER.filter(k => M.DEC[k].kind === o || k === o).slice(0, 3).forEach(k => { const d = M.DEC[k]; const opt = d.options.find(x => x.id === picks[k]); out.push(`${d.scene ? `Shot ${D.scenes.findIndex(s => s.id === d.scene) + 1}: ` : ''}${optLabel(opt)}`) }))
    return out
  }
  const groups = useMemo(() => { const g = new Map<string, NonNullable<typeof D.directors>>(); (D.directors || []).forEach(d => { if (!g.has(d.group)) g.set(d.group, []); g.get(d.group)!.push(d) }); return [...g.entries()] }, [D])
  const onScroll = () => {
    const el = scroller.current; if (!el) return
    let cur = ALL[0][0]
    ALL.forEach(([id]) => { const s = el.querySelector<HTMLElement>(`#plan-${id}`); if (s && s.offsetTop - el.scrollTop < 140) cur = id })
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) cur = ALL[ALL.length - 1][0]
    if (cur !== act) setAct(cur)
  }
  const revert = (c: { v: string; target: string; change: string }) => addNote({ kind: 'revert', a: 0, target: `Undo ${c.v}: ${c.target}`, strokes: [], quick: [], scene: D.scenes[0].id }, `Please undo this change: ${c.change}`)
  const ver = D.versions?.slice(-1)[0]?.v || 'v0.1'
  const open = notes.filter(n => n.status !== 'done')
  const libCount = Object.values(D.libraries || {}).reduce((a, l) => a + (l?.length || 0), 0)
  const fl = find.trim().toLowerCase()
  const groupsShown = GROUPS.map(g => ({ ...g, items: g.items.filter(([, n]) => !fl || n.toLowerCase().includes(fl)) })).filter(g => g.items.length)

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
      <nav className="hidden w-[230px] shrink-0 flex-col gap-3 overflow-y-auto border-r border-line p-4 lg:flex" aria-label="Plan sections" data-testid="plan-nav">
        <label className="relative block"><Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dim" /><input value={find} onChange={e => setFind(e.target.value)} placeholder="Find a section" className="field pl-8 text-[13px]" aria-label="Find a section" /></label>
        {groupsShown.map(g => (
          <div key={g.name}>
            <div className="label mb-1 px-2.5">{g.name}</div>
            <ul className="flex flex-col gap-0.5">{g.items.map(([id, name]) => (
              <li key={id}><button type="button" onClick={() => jump(id)} className={cx('flex w-full items-center rounded-[8px] px-2.5 py-1.5 text-left text-[13.5px] font-semibold', act === id ? 'bg-raise text-fg' : 'text-muted hover:text-fg')} data-section={id}>
                <span className="flex-1">{name}</span>{badge[id] ? <span className={cx('rounded-full px-1.5 text-[11px] font-bold', id === 'notes' ? 'bg-ember text-ember-ink' : 'bg-amber/20 text-amber')}>{badge[id]}</span> : null}
              </button></li>
            ))}</ul>
          </div>
        ))}
      </nav>
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-3 py-2 lg:hidden" aria-label="Plan sections">
        {ALL.map(([id, name]) => <button key={id} type="button" onClick={() => jump(id)} className={cx('shrink-0 rounded-full px-3 py-1 text-[12.5px] font-semibold', act === id ? 'bg-fg text-ink' : 'bg-raise text-muted')}>{name}</button>)}
      </div>
      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto" data-testid="plan">
        <div className="mx-auto flex max-w-[900px] flex-col gap-12 px-4 py-6 sm:px-8">
          <Section id="overview" title={`${D.project.product} · ${ver}`} lead={D.project.feature}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[['Runtime', `${C.total.toFixed(1)} s`], ['Shots', D.scenes.length], ['Decisions', M.ORDER.length], ['Options now', M.ORDER.reduce((a, k) => a + M.DEC[k].options.length, 0)], ['In libraries', libCount], ['Voices', (D.libraries?.voice || []).length], ['Open notes', open.length], ['Status', approval?.approved && approval.version === ver ? `Approved ${ver}` : 'In review']].map(([k, v]) => (
                <div key={k} className="card p-3"><div className="label">{k}</div><div className="mt-1 text-[20px] font-bold leading-none">{v}</div></div>
              ))}
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Row label="Look" value={optLabel(look)} onClick={() => { setSide('choices'); setView('watch') }} />
              <Row label="Music" value={`${optLabel(music)}${music?.bpm ? ` · ${Math.round(music.bpm)} BPM` : ''}`} onClick={() => jump('sound')} />
              <Row label="Motion" value={optLabel(motion)} onClick={() => jump('motion')} />
              <Row label="Voice" value={`${voice?.name || 'Sarah'} · ${voice?.accent || 'English'}`} onClick={() => jump('voice')} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="btn btn-go btn-sm" onClick={() => ui.set({ overlay: 'approve' })}><BadgeCheck size={14} />Approve {ver}</button>
              <button type="button" className="btn btn-sky btn-sm" onClick={() => ui.set({ overlay: 'claude' })}><Send size={14} />Send notes to Claude Code</button>
              <button type="button" className="btn btn-sm" onClick={() => jump('export')}><Download size={14} />Export spec</button>
            </div>
          </Section>

          <Section id="brief" title="Brief" lead={D.summary.message}>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {D.chief?.objective && <Fact k="Objective" v={D.chief.objective} />}
              {D.chief?.thesis && <Fact k="Thesis" v={D.chief.thesis} />}
              <Fact k="Audience" v={D.summary.audience} />
              <Fact k="Tone" v={D.summary.tone} />
              {D.chief?.feeling && <Fact k="Feeling" v={D.chief.feeling} />}
              {D.summary.arc && <Fact k="Arc" v={D.summary.arc} />}
              {D.chief?.depth && <Fact k="Depth" v={D.chief.depth} />}
              <Fact k="Format" v={`${D.project.format} · ${D.project.w}×${D.project.h} · ${D.project.fps || 30} fps · ${C.total.toFixed(1)} s`} />
            </dl>
          </Section>

          {D.story && D.story.length > 0 && (
            <Section id="story" title="Story" lead="One idea per shot. What the viewer should think at each beat.">
              <ol className="flex flex-col">
                {D.story.map((b, i) => { const r = C.of(b.scene); return (
                  <li key={i} className="grid grid-cols-[28px_1fr_auto] items-baseline gap-3 border-b border-line py-2.5 last:border-0">
                    <span className="mono text-[12px] text-dim">{i + 1}</span>
                    <div><b className="text-[14px]">{b.beat}</b> <span className="text-[13px] text-muted">· {r.sc.name}</span><p className="text-[13.5px] leading-snug">“{b.viewer}”</p></div>
                    <button type="button" className="mono text-[12px] text-sky hover:underline" onClick={() => watchAt(r.start + (r.sc.key ?? 0) * r.k)}>{tc(r.start)}</button>
                  </li>) })}
              </ol>
            </Section>
          )}

          <Section id="script" title="Script" lead={`Every line, in the current voice (${voice?.name || 'Sarah'}, ${voice?.accent || 'English'}). Click a time to hear it in the film.`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-[13px]">
                <thead className="text-dim"><tr className="border-b border-line"><th className="py-2 font-semibold">Shot</th><th className="font-semibold">Line now</th><th className="font-semibold">Other wordings</th><th className="font-semibold">Length</th><th className="font-semibold">Pace</th></tr></thead>
                <tbody>{C.vo().map(v => { const d = M.DEC[`${v.r.sc.id}.vo`]; const w = cleanText(v.o.text).split(/\s+/).length; const rate = w / Math.max(0.3, v.o.dur || 1); return (
                  <tr key={v.r.sc.id} className="border-b border-line align-top last:border-0">
                    <td className="py-2 pr-2"><button type="button" className="mono text-sky hover:underline" onClick={() => watchAt(Math.max(0, v.a - 0.3))}>{tc(v.a)}</button><div className="text-muted">{v.r.sc.name}</div></td>
                    <td className="pr-3 italic">“{cleanText(v.o.text)}”{v.missing && <span className="tag tag-amber ml-1 not-italic text-[10px]">not recorded</span>}</td>
                    <td className="pr-3 text-muted">{d?.options.filter(o => o.id !== v.o.id).map(o => `${o.id}: “${cleanText(o.text)}”`).join(' · ')}</td>
                    <td className="mono pr-3 text-muted">{(v.o.dur || 0).toFixed(1)} s</td>
                    <td className={cx('mono', rate > 3.4 && !/[ऀ-ॿ]/.test(v.o.text || '') ? 'text-amber' : 'text-muted')}>{rate.toFixed(1)} w/s</td>
                  </tr>) })}</tbody>
              </table>
            </div>
          </Section>

          <Section id="shots" title="Shot list" lead="The film shot by shot, as the engine will build it.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[13px]">
                <thead className="text-dim"><tr className="border-b border-line"><th className="py-2 font-semibold">#</th><th className="font-semibold">Shot</th><th className="font-semibold">Start</th><th className="font-semibold">Length</th><th className="font-semibold">In</th><th className="font-semibold">Camera</th><th className="font-semibold">Sounds</th><th className="font-semibold">Truth</th></tr></thead>
                <tbody>{C.TL.map(r => (
                  <tr key={r.sc.id} className="border-b border-line last:border-0">
                    <td className="py-2 mono text-dim">{r.i + 1}</td>
                    <td><button type="button" className="font-semibold hover:underline" onClick={() => { setView('board'); requestAnimationFrame(() => ui.set({ sheet: r.sc.id })) }}>{r.sc.name}</button></td>
                    <td className="mono text-muted">{tc(r.start)}</td><td className="mono text-muted">{(r.end - r.start).toFixed(1)} s</td>
                    <td className="text-muted">{r.i ? optLabel(C.o(`${r.sc.id}.transition`)) : '–'}</td><td className="text-muted">{optLabel(C.o(`${r.sc.id}.camera`))}</td>
                    <td className="text-muted">{(r.sc.sfx || []).length}</td><td className="text-muted">{(r.sc.truth || 'real').replace(/_/g, ' ')}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          </Section>

          <Section id="look" title="Look" lead={look ? `${optLabel(look)}. ${cleanText(look.pitch || look.why)}` : ''}>
            {look?.tokens && <div className="flex flex-wrap gap-2">{Object.entries(look.tokens).filter(([, v]) => v.startsWith('#')).map(([k, v]) => <Tip key={k} title={k} desc={v}><div className="flex flex-col items-center gap-1"><span className="h-10 w-14 rounded-[8px] border border-line2" style={{ background: v }} /><span className="mono text-[10.5px] text-dim">{k}</span></div></Tip>)}</div>}
            {look?.tokens && <p className="mt-3 text-[13px] text-muted">Display: {(look.tokens.display || '').split(',')[0].replace(/'/g, '')} · UI: {(look.tokens.ui || '').split(',')[0].replace(/'/g, '')}</p>}
            <div className="label mb-2 mt-5">Every look you can use</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[...M.DEC.direction.options, ...(D.libraries?.direction || []).filter(l => !M.DEC.direction.options.some(o => o.ref === l.id))].map(o => {
                const inUse = M.DEC.direction.options.some(x => x.id === o.id && !o.origin) || M.DEC.direction.options.some(x => x.ref === o.id) || M.DEC.direction.options.includes(o)
                const current = picks.direction === o.id && M.DEC.direction.options.includes(o)
                return (
                  <div key={o.id + (o.ref || '')} className={cx('card flex items-center gap-3 p-2.5', current && 'border-sky')}>
                    <div className="flex shrink-0 overflow-hidden rounded-[6px] border border-line2">{['bg', 'card', 'accent'].map(t => <span key={t} className="h-9 w-5" style={{ background: o.tokens?.[t] }} />)}</div>
                    <div className="min-w-0 flex-1"><b className="text-[13.5px]">{optLabel(o)}</b><p className="truncate text-[12px] text-muted">{cleanText(o.pitch || o.why)}</p></div>
                    {current ? <span className="tag tag-sky">In use</span> : inUse ? <button type="button" className="btn btn-sm" onClick={() => { setPick('direction', o.id); toast.success(`Look: ${optLabel(o)}`) }}>Use</button> : <button type="button" className="btn btn-sm" onClick={() => { addFromLibrary('direction', o, true); toast.success(`Added and using ${o.name}`) }}><Sparkles size={13} />Use</button>}
                  </div>
                )
              })}
            </div>
            {D.style_rules && <dl className="mt-5 grid gap-3 sm:grid-cols-2">{Object.entries(D.style_rules).map(([k, v]) => <Fact key={k} k={k} v={v} />)}</dl>}
          </Section>

          <Section id="motion" title="Motion and camera" lead={`${optLabel(motion)}: ${cleanText(motion?.why)}`}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[...M.DEC.motion.options, ...(D.libraries?.motion || []).filter(l => !M.DEC.motion.options.some(o => o.ref === l.id))].map(o => {
                const onCard = M.DEC.motion.options.includes(o), current = onCard && picks.motion === o.id
                return (
                  <button key={o.id + (o.ref || '')} type="button" className={cx('card flex flex-col items-start gap-1 p-2.5 text-left hover:border-line2', current && 'border-sky')} onClick={() => { if (onCard) setPick('motion', o.id); else addFromLibrary('motion', o, true); toast.success(`Motion: ${optLabel(o)}`) }}>
                    <Curve o={o} w={80} h={40} className="text-sky" /><b className="text-[13px]">{optLabel(o)}</b>{current && <span className="tag tag-sky text-[10.5px]">In use</span>}
                  </button>
                )
              })}
            </div>
            <div className="label mb-2 mt-5">Camera per shot</div>
            <ul className="flex flex-col gap-1">{C.TL.map(r => { const cam = C.o(`${r.sc.id}.camera`); return <li key={r.sc.id} className="flex gap-3 border-b border-line py-1.5 text-[13px] last:border-0"><span className="mono w-6 text-dim">{r.i + 1}</span><b className="w-28 shrink-0">{r.sc.name}</b><span className="text-muted">{optLabel(cam)}{cam?.why ? ` · ${cleanText(cam.why)}` : ''}</span></li> })}</ul>
          </Section>

          {D.references && D.references.length > 0 && (
            <Section id="refs" title="References" lead="What we borrow (grammar, never content) and what we avoid.">
              <div className="flex flex-col gap-2">{D.references.map(r => <div key={r.name} className="card p-3 text-[13px] leading-snug"><b>{r.name}</b><p className="mt-1"><span className="text-mint">Borrow:</span> {r.borrow}</p><p><span className="text-ember">Avoid:</span> {r.avoid}</p>{r.scenes && <p className="text-dim">Used in: {r.scenes}</p>}</div>)}</div>
            </Section>
          )}

          <Section id="sound" title="Music and sounds" lead={music ? `${optLabel(music)}${music.bpm ? ` · ${Math.round(music.bpm)} BPM` : ''}${music.lic ? ` · ${music.lic}` : ''}` : ''}>
            {D.audio_notes && <ul className="mb-4 flex list-disc flex-col gap-1 pl-5 text-[13.5px] leading-snug">{D.audio_notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
            <div className="label mb-2">Music you can use</div>
            <ul className="mb-5 flex flex-col gap-1.5">
              {[...M.DEC.music.options, ...(D.libraries?.music || []).filter(l => !M.DEC.music.options.some(o => o.ref === l.id))].map(o => {
                const onCard = M.DEC.music.options.includes(o), current = onCard && picks.music === o.id
                return (
                  <li key={o.id + (o.ref || '')} className={cx('flex items-center gap-2 rounded-[10px] border px-3 py-2 text-[13px]', current ? 'border-sky bg-sky/10' : 'border-line')}>
                    <div className="min-w-0 flex-1"><b>{optLabel(o)}</b> <span className="mono text-[11.5px] text-dim">{o.bpm ? `${Math.round(o.bpm)} BPM` : 'free tempo'}</span><p className="truncate text-[12px] text-muted">{(o.tags || []).slice(0, 5).join(' · ') || cleanText(o.why)}</p></div>
                    {o.src && <Preview src={o.src} dur={10} />}
                    {current ? <span className="tag tag-sky">In use</span> : <button type="button" className="btn btn-sm" onClick={() => { if (onCard) setPick('music', o.id); else addFromLibrary('music', o, true); toast.success(`Music: ${optLabel(o)}`) }}>Use</button>}
                  </li>
                )
              })}
            </ul>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[13px]">
                <thead className="text-dim"><tr className="border-b border-line"><th className="py-2 font-semibold">Time</th><th className="font-semibold">Shot</th><th className="font-semibold">Sound</th><th className="font-semibold">Pick</th><th className="font-semibold">Beat</th></tr></thead>
                <tbody>{C.sfx().filter(s => s.j === 0 && s.o?.src).map(s => { const ms = beatOffsetMs(C, s.key); return (
                  <tr key={s.key} className="border-b border-line last:border-0">
                    <td className="py-2"><button type="button" className="mono text-sky hover:underline" onClick={() => watchAt(Math.max(0, s.a - 0.5))}>{tc(s.a)}</button></td>
                    <td>{s.r.i + 1}</td><td>{s.x.label}</td><td className="text-muted">{optLabel(s.o)}</td>
                    <td className={cx('mono', ms != null && Math.abs(ms) > 40 ? 'text-amber' : 'text-muted')}>{ms == null ? '–' : Math.abs(ms) <= 15 ? 'on' : `${ms > 0 ? '+' : ''}${ms} ms`}</td>
                  </tr>) })}</tbody>
              </table>
            </div>
          </Section>

          <Section id="voice" title="Voice and cast" lead={`${(D.libraries?.voice || []).length} voices in ${[...new Set((D.libraries?.voice || []).map(v => v.accent))].join(', ')}. Each one reads all of the lines; Hindi voices read Hindi versions while the on-screen text stays English.`}>
            <div className="grid gap-2 sm:grid-cols-2">
              {(D.libraries?.voice || []).map(v => {
                const onCard = M.DEC.voice?.options.find(o => o.ref === v.id), current = onCard && picks.voice === onCard.id
                return (
                  <div key={v.id} className={cx('card flex flex-col gap-1.5 p-3', current && 'border-sky')}>
                    <div className="flex items-center gap-2"><b className="text-[14px]">{v.name}</b><span className="tag px-1.5 py-0 text-[10.5px]">{v.accent} · {v.gender}</span>{v.sample && <span className="ml-auto"><Preview src={v.sample} dur={3} /></span>}</div>
                    <p className="text-[12.5px] leading-snug text-muted">{v.intro}</p>
                    {current ? <span className="tag tag-sky self-start">Narrating now</span> : <button type="button" className="btn btn-sm self-start" onClick={() => { if (onCard) setPick('voice', onCard.id); else addFromLibrary('voice', v, true); toast.success(`Voice: ${v.name}`); requestAnimationFrame(() => tryMoment('voice')) }}>Use this voice</button>}
                  </div>
                )
              })}
            </div>
          </Section>

          {groups.length > 0 && (
            <Section id="team" title="Director team" lead={`${(D.directors || []).filter(d => d.active).length} specialists worked on this plan; ${(D.directors || []).filter(d => !d.active).length} were not needed for a film this size.`}>
              <div className="flex flex-col gap-5">
                {groups.map(([g, list]) => (
                  <div key={g}>
                    <div className="label mb-2">{g}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {list.map(d => { const now = ownerPicks(d.owns); return (
                        <div key={d.id} className={cx('card p-3', !d.active && 'opacity-60')}>
                          <div className="flex items-center gap-2"><b className="flex-1 text-[13.5px]">{d.name}</b>{d.active ? <span className="tag tag-mint">Active</span> : <span className="tag"><CircleSlash size={11} />Not needed</span>}</div>
                          <p className="mt-1 text-[13px] leading-snug">{d.summary}</p>
                          {d.why && <p className="mt-1 text-[12.5px] leading-snug text-muted">{d.why}</p>}
                          {now.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{now.map((x, i) => <span key={i} className="tag tag-sky">{x}</span>)}</div>}
                        </div>) })}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {D.assets && (
            <Section id="assets" title="Assets" lead="Everything the film uses, where it came from, and whether it is real.">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[13px]">
                  <thead className="text-dim"><tr className="border-b border-line"><th className="py-2 font-semibold">Asset</th><th className="font-semibold">Source</th><th className="font-semibold">Licence</th><th className="font-semibold">Truth</th></tr></thead>
                  <tbody>{D.assets.map(a => <tr key={a.name} className="border-b border-line align-top last:border-0"><td className="py-2 pr-3 font-semibold">{a.name}</td><td className="pr-3 text-muted">{a.source}</td><td className="pr-3 text-muted">{a.licence}</td><td className="text-muted">{a.truth || '–'}</td></tr>)}</tbody>
                </table>
              </div>
            </Section>
          )}

          <Section id="build" title="Production" lead={D.engine?.why || ''}>
            <dl className="grid gap-3 sm:grid-cols-2">
              {D.pipeline?.engine && <Fact k="Engine" v={D.pipeline.engine} />}
              {D.engine?.alt && <Fact k="Alternative" v={D.engine.alt} />}
              {D.pipeline?.formats && <Fact k="Output" v={D.pipeline.formats} />}
              {D.pipeline?.estimate && <Fact k="Estimate" v={D.pipeline.estimate} />}
            </dl>
            {D.pipeline?.steps && <ol className="mt-4 flex flex-col gap-1.5">{D.pipeline.steps.map((s, i) => <li key={i} className="flex gap-3 text-[13.5px]"><span className="mono grid h-6 w-6 shrink-0 place-items-center rounded-full bg-raise text-[11px]">{i + 1}</span><span className="pt-0.5">{s}</span></li>)}</ol>}
          </Section>

          <Section id="gates" title="Approvals" lead="What has to be signed off before the real video is built. On a film this size they are one approval.">
            <div className="flex flex-wrap gap-1.5">{(D.gates || []).map(g => <Tip key={g.name} title={g.name} desc={`Covers ${g.covers}`}><span className="tag">{g.name}</span></Tip>)}</div>
            <p className="mt-3 text-[13.5px]">{approval?.approved ? <span className="text-mint">Approved {approval.version} on {new Date(approval.at).toLocaleString()}.</span> : <span className="text-muted">Not approved yet.</span>} <button type="button" className="font-semibold text-sky hover:underline" onClick={() => ui.set({ overlay: 'approve' })}>{approval?.approved ? 'Review' : 'Approve'}</button></p>
          </Section>

          <Section id="checks" title="Checks" lead="What the plan is tested against, for your current picks. Click a timed check to see it.">
            <ul className="flex flex-col gap-1.5">
              {checks.map((c, i) => { const I = c.level === 'ok' ? CheckCircle2 : c.level === 'bad' ? XCircle : AlertTriangle; return (
                <li key={i}><button type="button" disabled={c.t == null} onClick={() => c.t != null && watchAt(c.t)} className="flex w-full items-start gap-2.5 rounded-[8px] px-2 py-1.5 text-left text-[13.5px] leading-snug enabled:hover:bg-raise disabled:opacity-100">
                  <I size={16} className={cx('mt-0.5 shrink-0', c.level === 'ok' ? 'text-mint' : c.level === 'bad' ? 'text-ember' : 'text-amber')} /><span className="flex-1">{c.text}</span>{c.t != null && <span className="mono text-[12px] text-sky">{tc(c.t)}</span>}
                </button></li>) })}
            </ul>
          </Section>

          <Section id="risks" title="Risks" lead="What could go wrong in production, and what we do about it.">
            <ul className="flex flex-col gap-2 text-[13.5px]">
              {[...checks.filter(c => c.level !== 'ok').map(c => ({ level: c.level, text: c.text })), ...(D.risks || []),
                { level: 'warn', text: 'Render-only sounds (Mixkit impact and shimmer) are added in production; this page cannot play them.' },
                { level: 'warn', text: 'Fish Audio s2.1-pro-free is free through 2026-11-30; re-check its terms after that date.' }].map((r, i) => (
                <li key={i} className="flex gap-2.5"><AlertTriangle size={15} className={cx('mt-0.5 shrink-0', r.level === 'bad' ? 'text-ember' : 'text-amber')} /><span>{r.text}</span></li>
              ))}
            </ul>
          </Section>

          <Section id="notes" title="Notes" lead={`${notes.length} notes, ${open.length} open. Claude Code works through them in the next version.`}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(Object.keys(CATS) as (keyof typeof CATS)[]).map(c => { const n = notes.filter(x => (x.category || 'other') === c); return n.length ? <div key={c} className="card p-3"><div className="label">{CATS[c]}</div><div className="mt-1 text-[20px] font-bold leading-none">{n.length}</div><div className="text-[12px] text-dim">{n.filter(x => x.status !== 'done').length} open</div></div> : null })}
            </div>
            <ul className="mt-4 flex flex-col gap-1.5">
              {open.slice(0, 12).map(n => <li key={n.id} className="flex gap-2 text-[13px]"><span className="mono w-14 text-dim">{tc(n.t)}</span><b className="w-40 shrink-0 truncate">{n.target}</b><span className="truncate text-muted">{n.text}</span></li>)}
            </ul>
            <button type="button" className="btn btn-sm mt-3" onClick={() => { setSide('notes'); setView('watch') }}>Open notes</button>
          </Section>

          <Section id="versions" title="Versions" lead="Every version of this previs and what changed.">
            <ol className="flex flex-col gap-2">{(D.versions || []).slice().reverse().map(v => <li key={v.v} className="card p-3"><div className="flex items-baseline gap-2"><b className="mono">{v.v}</b><span className="text-[12px] text-dim">{v.date}</span></div><p className="mt-1 text-[13.5px] leading-snug">{v.note}</p></li>)}</ol>
            {D.changes && D.changes.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2">{D.changes.map((c, i) => (
                <li key={i} className="flex items-start gap-3 rounded-[10px] border border-line p-3 text-[13.5px]">
                  <span className="mono text-[12px] text-dim">{c.v}</span>
                  <div className="flex-1"><b>{c.target}</b><p className="text-muted">{c.change}{c.reason ? ` (${c.reason})` : ''}</p></div>
                  <Tip title="Ask to undo" desc="Leaves a note asking Claude to bring back how it was before this change"><button type="button" className="btn btn-sm" onClick={() => revert(c)}><Undo2 size={13} />Undo</button></Tip>
                </li>))}</ul>
            )}
          </Section>

          <Section id="export" title="Export spec" lead="The production spec as it would be frozen right now from your picks. Claude freezes the same thing when you approve.">
            <ExportSpec />
          </Section>
        </div>
      </div>
    </div>
  )
}

function ExportSpec() {
  useStudio(s => s.C)
  const spec = currentSpec()
  const text = JSON.stringify(spec, null, 2)
  const save = async () => {
    const w = window as unknown as { claude?: { use(n: string): Promise<{ save(r: { filename: string; data: string }): Promise<unknown> } | null> } }
    const dl = w.claude?.use ? await w.claude.use('downloads').catch(() => null) : null
    if (!dl) { try { await navigator.clipboard.writeText(text); toast.success('Saving files is not available here; the spec is on your clipboard') } catch { toast.error('Saving is not available here') } return }
    try { await dl.save({ filename: `${spec?.film || 'film'}-${spec?.version || ''}-spec.json`, data: text }) } catch { /* declined */ }
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button type="button" className="btn btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(text); toast.success('Spec copied') } catch { toast.error('Copy is blocked here') } }}><Clipboard size={14} />Copy</button>
        <button type="button" className="btn btn-sm" onClick={save}><Download size={14} />Save as file</button>
      </div>
      <pre tabIndex={0} aria-label="Production spec" className="mono max-h-[420px] overflow-auto rounded-[10px] border border-line bg-ink p-3 text-[11.5px] leading-snug" data-testid="spec">{text}</pre>
    </div>
  )
}

function Section({ id, title, lead, children }: { id: string; title: string; lead?: string; children: React.ReactNode }) {
  return (
    <section id={`plan-${id}`} className="scroll-mt-6">
      <h2 className="text-[21px] font-bold leading-tight">{title}</h2>
      {lead && <p className="mt-1 max-w-[70ch] text-[14px] leading-snug text-muted">{lead}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
function Fact({ k, v }: { k: string; v: string }) { return <div><dt className="label">{k}</dt><dd className="mt-0.5 text-[13.5px] leading-snug">{v}</dd></div> }
function Row({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="card flex items-center gap-3 p-3 text-left hover:border-line2"><span className="label w-14">{label}</span><span className="flex-1 truncate text-[14px] font-semibold">{value}</span></button>
}
