import { useEffect, useRef } from 'react'
import { Bot, ChevronUp, ListChecks, MessageSquare, SlidersHorizontal, X } from 'lucide-react'
import { ui, useStudio, type Side } from '../../state/store'
import { ChoicesPanel } from './ChoicesPanel'
import { NotesPanel } from './NotesPanel'
import { StepsPanel } from './StepsPanel'
import { AskPanel, useAskAvailable } from './AskPanel'
import { IconBtn, Tip } from '../ui'
import { usePhone } from '../../lib/hooks'
import { cx, store as ls } from '../../lib/util'

const TABS: { id: Side; name: string; icon: typeof Bot; desc: string }[] = [
  { id: 'choices', name: 'Choices', icon: SlidersHorizontal, desc: 'Every decision with three options. Pick one and the film changes and plays that moment.' },
  { id: 'notes', name: 'Notes', icon: MessageSquare, desc: 'Your comments, in film order. Claude replies here.' },
  { id: 'steps', name: 'Guide', icon: ListChecks, desc: 'A short guided review, one decision at a time, ending in approval.' },
  { id: 'ask', name: 'Ask', icon: Bot, desc: 'Ask the director why something was chosen, or ask for a change.' },
]

/** Choices, notes, the guided review and the director, docked beside the player or as a drawer. */
export function SidePanel({ drawer }: { drawer?: boolean }) {
  const side = useStudio(s => s.side)
  const peek = useStudio(s => s.peek) && !!drawer
  const playing = useStudio(s => s.playing)
  const was = useRef(false)
  // The sheet comes back up when the change has finished playing.
  useEffect(() => { if (was.current && !playing && peek) ui.set({ peek: false }); was.current = playing }, [playing, peek])
  const open = useStudio(s => s.notes.filter(n => n.status !== 'done').length)
  const ask = useAskAvailable()
  const phone = usePhone()
  const tabs = TABS.filter(t => t.id !== 'ask' || ask)
  const cur = tabs.some(t => t.id === side) ? side : 'choices'
  if (peek && phone) return (
    <button type="button" onClick={() => ui.set({ peek: false })} className="fixed inset-x-0 bottom-0 z-[85] flex items-center gap-2 rounded-t-[18px] border-t border-line2 bg-panel px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 text-left shadow-2xl" data-testid="peek">
      <span className="h-2 w-2 rounded-full bg-ember pulse" /><span className="flex-1 text-[13.5px] font-semibold">Playing your change</span><span className="flex items-center gap-1 text-[13px] text-sky">Back to choices<ChevronUp size={15} /></span>
    </button>
  )
  const panel = (
    <aside className={cx('flex min-h-0 flex-col bg-panel', drawer ? (phone ? 'fixed inset-x-0 bottom-0 z-[85] h-[78vh] rounded-t-[18px] border-t border-line2 shadow-2xl' : 'fixed bottom-0 right-0 top-0 z-[85] w-[min(420px,92vw)] border-l border-line2 shadow-2xl') : 'h-full border-l border-line')}
      aria-label="Review panel" data-testid="side" data-tour="side" style={drawer ? { animation: 'popIn .16s ease-out' } : undefined}>
      {drawer && phone && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line2" aria-hidden />}
      <div className="flex items-center gap-1 px-3 pb-3 pt-3">
        <div role="tablist" aria-label="Panel" className="flex flex-1 gap-0.5">
          {tabs.map(t => (
            <Tip key={t.id} title={t.name} desc={t.desc}>
              <button type="button" role="tab" aria-selected={cur === t.id} onClick={() => { ui.set({ side: t.id }); ls.set('studio2:side', t.id) }} data-tab={t.id}
                className={cx('relative flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[9px] text-[13px] font-semibold transition-colors', cur === t.id ? 'bg-raise text-fg' : 'text-muted hover:bg-panel2 hover:text-fg')}>
                <t.icon size={15} /><span>{t.name}</span>
                {t.id === 'notes' && open > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ember px-1 text-[10.5px] font-extrabold text-ember-ink">{open}</span>}
              </button>
            </Tip>
          ))}
        </div>
        {drawer && <IconBtn small label="Close panel" keys={['Esc']} onClick={() => ui.set({ drawer: false })}><X size={16} /></IconBtn>}
      </div>
      {cur === 'choices' && <ChoicesPanel />}
      {cur === 'notes' && <NotesPanel />}
      {cur === 'steps' && <StepsPanel />}
      {cur === 'ask' && <AskPanel />}
    </aside>
  )
  if (!drawer) return panel
  return <>{<div className="scrim !z-[84] !bg-black/40" onClick={() => ui.set({ drawer: false, peek: false })} />}{panel}</>
}
