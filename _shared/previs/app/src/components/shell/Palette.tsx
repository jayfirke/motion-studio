import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { useMemo } from 'react'
import { openFilm, redo, resetPicks, setMix, setPick, setPrefs, setSide, setView, undo, ui, useStudio } from '../../state/store'
import { optLabel } from '../../data/model'
import { playback } from '../../engine/playback'
import { tryMoment } from '../choices/ChoiceCard'
import { toggleComment, toggleFull } from '../player/Controls'
import { cleanText } from '../../data/model'

interface Item { id: string; group: string; label: string; hint?: string; run: () => void; words?: string }

/** Type to find any choice, shot or action. */
export function Palette() {
  const open = useStudio(s => s.overlay === 'palette')
  const M = useStudio(s => s.M), C = useStudio(s => s.C), picks = useStudio(s => s.picks), films = useStudio(s => s.films), film = useStudio(s => s.film)
  const close = () => ui.set({ overlay: null })
  const items = useMemo<Item[]>(() => {
    if (!M || !C) return []
    const watch = (f: () => void) => () => { if (ui.get().view !== 'watch') setView('watch'); requestAnimationFrame(f) }
    const out: Item[] = [
      { id: 'play', group: 'Play', label: ui.get().playing ? 'Pause' : 'Play', hint: 'Space', run: watch(() => playback.toggle()) },
      { id: 'start', group: 'Play', label: 'Play from the start', run: watch(() => playback.play(0)) },
      ...C.TL.map(r => ({ id: `shot-${r.i}`, group: 'Go to a shot', label: `Shot ${r.i + 1}: ${r.sc.name}`, words: r.sc.purpose, run: watch(() => playback.seek(r.start + (r.sc.key ?? 0) * r.k)) })),
      { id: 'v-watch', group: 'Views', label: 'Watch', hint: '1', run: () => setView('watch') },
      { id: 'v-board', group: 'Views', label: 'Storyboard', hint: '2', run: () => setView('board') },
      { id: 'v-plan', group: 'Views', label: 'Plan', hint: '3', run: () => setView('plan') },
      { id: 'comment', group: 'Review', label: 'Comment on the frame', hint: 'C', run: watch(() => { if (ui.get().mode !== 'comment') toggleComment() }) },
      { id: 'notes', group: 'Review', label: 'Show comments', run: () => setSide('notes') },
      { id: 'guide', group: 'Review', label: 'Guided review', run: () => { setView('watch'); setSide('steps') } },
      { id: 'approve', group: 'Review', label: 'Approve this version', run: () => ui.set({ overlay: 'approve' }) },
      { id: 'full', group: 'Review', label: 'Full screen', hint: 'F', run: watch(toggleFull) },
      { id: 'undo', group: 'Edit', label: 'Undo', run: undo }, { id: 'redo', group: 'Edit', label: 'Redo', run: redo },
      { id: 'reset', group: 'Edit', label: "Reset every choice to the director's pick", run: () => resetPicks() },
      { id: 'mute', group: 'Sound', label: ui.get().mix.muted ? 'Unmute' : 'Mute', hint: 'M', run: () => setMix({ muted: !ui.get().mix.muted }) },
      { id: 'help', group: 'Help', label: 'Keyboard shortcuts and help', hint: '?', run: () => ui.set({ overlay: 'help' }) },
      { id: 'claude', group: 'Review', label: 'Send my comments to Claude Code', run: () => ui.set({ overlay: 'claude' }) },
      { id: 'ask', group: 'Review', label: 'Ask the director', run: () => { setView('watch'); setSide('ask') } },
      { id: 'theme-light', group: 'Settings', label: 'Light theme', run: () => setPrefs({ theme: 'light' }) },
      { id: 'theme-dark', group: 'Settings', label: 'Dark theme', run: () => setPrefs({ theme: 'dark' }) },
      { id: 'theme-system', group: 'Settings', label: 'Theme: match claude.ai / system', run: () => setPrefs({ theme: 'system' }) },
      { id: 'captions', group: 'Settings', label: ui.get().prefs.captions ? 'Hide captions' : 'Show captions', hint: 'S', run: () => setPrefs({ captions: !ui.get().prefs.captions }) },
      ...C.TL.map(r => ({ id: `sheet-${r.i}`, group: 'Shot sheets', label: `Shot sheet ${r.i + 1}: ${r.sc.name}`, run: () => { setView('board'); requestAnimationFrame(() => ui.set({ sheet: r.sc.id })) } })),
      ...M.ORDER.filter(k => ['direction', 'music', 'motion', 'pacing', 'voice'].includes(k)).map(k => ({ id: `more-${k}`, group: 'More options', label: `More options: ${M.DEC[k].q}`, words: 'add library browse', run: () => { setView('watch'); requestAnimationFrame(() => ui.set({ library: k })) } })),
      { id: 'tour', group: 'Help', label: 'Quick tour', run: () => { setView('watch'); requestAnimationFrame(() => ui.set({ overlay: 'tour' })) } },
    ]
    M.ORDER.forEach(k => {
      const d = M.DEC[k], shot = d.scene ? `Shot ${M.D.scenes.findIndex(s => s.id === d.scene) + 1} · ` : ''
      d.options.forEach(o => out.push({ id: `pick-${k}-${o.id}`, group: 'Choices', label: `${shot}${d.q} ${o.id}: ${optLabel(o)}`, hint: picks[k] === o.id ? 'current' : o.id === d.chosen ? 'recommended' : undefined, words: cleanText(o.why), run: watch(() => { setPick(k, o.id); requestAnimationFrame(() => tryMoment(k)) }) }))
    })
    if (films.length > 1) films.forEach(f => f.id !== film?.id && out.push({ id: `film-${f.id}`, group: 'Films', label: `Open ${f.name || f.id}`, run: () => openFilm(f) }))
    return out
  }, [M, C, picks, films, film])
  const groups = useMemo(() => { const g = new Map<string, Item[]>(); items.forEach(i => { if (!g.has(i.group)) g.set(i.group, []); g.get(i.group)!.push(i) }); return [...g.entries()] }, [items])
  return (
    <Dialog.Root open={open} onOpenChange={o => { if (!o) close() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="scrim !z-[110]" />
        <Dialog.Content className="pop fixed left-1/2 top-[12vh] z-[111] w-[calc(100vw-24px)] max-w-[600px] -translate-x-1/2 overflow-hidden" aria-describedby={undefined} onKeyDown={e => e.stopPropagation()}>
          <Dialog.Title className="sr-only">Search choices and commands</Dialog.Title>
          <Command label="Search choices and commands" className="flex flex-col" loop filter={(value, search) => search.toLowerCase().split(/\s+/).filter(Boolean).every(w => value.toLowerCase().includes(w)) ? 1 : 0}>
            <Command.Input autoFocus placeholder="Type a choice, a shot or an action…" className="w-full border-b border-line bg-transparent px-4 py-3.5 text-[15px] outline-none placeholder:text-dim" />
            <Command.List className="max-h-[min(60vh,460px)] overflow-y-auto p-1.5">
              <Command.Empty className="px-3 py-6 text-center text-[13.5px] text-muted">Nothing found.</Command.Empty>
              {groups.map(([g, list]) => (
                <Command.Group key={g} heading={g} className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[.07em] [&_[cmdk-group-heading]]:text-dim">
                  {list.map(it => (
                    <Command.Item key={it.id} value={`${it.label} ${it.words || ''} ${it.id}`} onSelect={() => { close(); it.run() }} className="flex cursor-pointer items-center gap-2 rounded-[8px] px-2.5 py-2 text-[13.5px] data-[selected=true]:bg-raise">
                      <span className="min-w-0 flex-1 truncate">{it.label}</span>{it.hint && <span className="text-[11.5px] text-dim">{it.hint}</span>}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
