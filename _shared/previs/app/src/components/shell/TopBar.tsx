import * as DM from '@radix-ui/react-dropdown-menu'
import { BadgeCheck, Bot, Captions, Check, ChevronDown, CircleHelp, Clapperboard, Command, Keyboard, LayoutGrid, Loader2, Monitor, MonitorPlay, Moon, PanelRight, Redo2, Repeat, ScrollText, Settings2, Sparkles, Sun, Undo2 } from 'lucide-react'
import { openFilm, redo, setPrefs, setView, ui, undo, useStudio, type Prefs, type View } from '../../state/store'
import { IconBtn, Tip } from '../ui'
import { usePhone } from '../../lib/hooks'
import { useDocked } from '../../lib/layout'
import { cx, modKey } from '../../lib/util'

const VIEWS: { id: View; name: string; icon: typeof MonitorPlay; desc: string; key: string }[] = [
  { id: 'watch', name: 'Watch', icon: MonitorPlay, desc: 'The player: watch, change choices and comment on any frame', key: '1' },
  { id: 'board', name: 'Storyboard', icon: LayoutGrid, desc: 'Every shot as a card. Each card plays its shot in place.', key: '2' },
  { id: 'plan', name: 'Plan', icon: ScrollText, desc: 'The production plan: brief, story, director team, assets, checks', key: '3' },
]

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-ember text-ember-ink"><Clapperboard size={16} strokeWidth={2.4} /></span>
      <span className="hidden text-[14.5px] font-extrabold tracking-tight xl:inline">Previs Studio</span>
    </span>
  )
}

export function TopBar() {
  const view = useStudio(s => s.view)
  const film = useStudio(s => s.film)
  const films = useStudio(s => s.films)
  const M = useStudio(s => s.M)
  const approval = useStudio(s => s.approval)
  const past = useStudio(s => s.past.length), future = useStudio(s => s.future.length)
  const phone = usePhone(), docked = useDocked()
  const ver = M?.D.versions?.slice(-1)[0]?.v || 'v0.1'
  const approved = approval?.approved && approval.version === ver
  return (
    <header className="flex h-[56px] shrink-0 items-center gap-2 border-b border-line bg-ink px-2.5 sm:gap-3 sm:px-4" data-testid="topbar">
      {(!phone || films.length > 1 || !film) && (
        <Tip title="All films" desc="See every film in the studio" side="bottom">
          <button type="button" className="rounded-[9px] p-1 hover:bg-raise" onClick={() => setView('home')} aria-label="Previs Studio: all films"><Logo /></button>
        </Tip>
      )}
      {film && M && (
        films.length > 1 ? (
          <DM.Root>
            <DM.Trigger asChild><button type="button" className="btn btn-ghost min-w-0 px-2 text-[14.5px]"><span className="truncate">{film.name || M.D.project.product}</span><ChevronDown size={14} className="text-dim" /></button></DM.Trigger>
            <DM.Portal><DM.Content className="pop z-[100] min-w-[220px] p-1.5" sideOffset={6} align="start">
              {films.map(f => <DM.Item key={f.id} onSelect={() => openFilm(f)} className="flex cursor-pointer items-center rounded-md px-2 py-1.5 text-[13.5px] outline-none data-[highlighted]:bg-raise">{f.name || f.id}{f.id === film.id && <span className="ml-auto text-sky">●</span>}</DM.Item>)}
            </DM.Content></DM.Portal>
          </DM.Root>
        ) : <b className="max-w-[34vw] shrink-0 truncate text-[14.5px]">{film.name || M.D.project.product}</b>
      )}
      {M && !phone && <Tip title={`Version ${ver}`} desc={M.D.project.status || 'In review'} side="bottom"><span className="tag mono">{ver}</span></Tip>}
      <span className="flex-1" />
      {film && M && view !== 'home' && (
        <nav className="seg" aria-label="Views" data-testid="views">
          {VIEWS.map(v => (
            <Tip key={v.id} title={v.name} desc={v.desc} keys={[v.key]} side="bottom">
              <button type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)} aria-label={v.name} data-view={v.id} className={cx(phone && '!px-2.5')}><v.icon size={15} />{!phone && <span className="hidden md:inline">{v.name}</span>}</button>
            </Tip>
          ))}
        </nav>
      )}
      <span className="flex-1" />
      {film && M && view !== 'home' && (
        <>
          {!phone && <SyncDot />}
          <ClaudePill compact={phone} />
          {!phone && <IconBtn label="Undo" desc={past ? 'Undo the last change to a choice or sound' : 'Nothing to undo'} keys={[modKey, 'Z']} tipSide="bottom" onClick={undo} disabled={!past}><Undo2 size={17} /></IconBtn>}
          {!phone && <IconBtn label="Redo" desc="Redo what you undid" keys={['⇧', modKey, 'Z']} tipSide="bottom" onClick={redo} disabled={!future}><Redo2 size={17} /></IconBtn>}
          {!phone && <IconBtn label="Search and commands" desc="Find any choice, shot or action by typing" keys={[modKey, 'K']} tipSide="bottom" onClick={() => ui.set({ overlay: 'palette' })}><Command size={17} /></IconBtn>}
          <SettingsMenu />
          <IconBtn label="Help" desc="Shortcuts and how this works" keys={['?']} tipSide="bottom" onClick={() => ui.set({ overlay: 'help' })}><CircleHelp size={18} /></IconBtn>
          {!docked && <IconBtn label="Choices and comments" desc="Open the review panel" tipSide="bottom" onClick={() => ui.set({ drawer: !ui.get().drawer })} data-testid="panel-toggle"><PanelRight size={18} /></IconBtn>}
          <Tip title={approved ? `Approved ${ver}` : 'Approve'} desc={approved ? 'Claude is building this version. Click to review or withdraw.' : 'When the plan feels right, approve it. Claude then builds the real video from your picks.'} side="bottom">
            <button type="button" className={cx('btn', approved ? 'border-mint/40 text-mint' : 'btn-go', phone && 'px-2.5')} onClick={() => ui.set({ overlay: 'approve' })} data-testid="approve" data-tour="approve">
              <BadgeCheck size={16} />{!phone && (approved ? 'Approved' : 'Approve')}
            </button>
          </Tip>
        </>
      )}
    </header>
  )
}

function SyncDot() {
  const sync = useStudio(s => s.sync), saving = useStudio(s => s.saving)
  const [dot, label, desc] = sync === 'live'
    ? saving === 'saving' ? ['bg-amber', 'Saving', 'Saving your change…'] : saving === 'error' ? ['bg-ember', 'Not saved', 'The last change did not save. It is kept in this browser; try again.'] : ['bg-mint', 'Saved', 'Your picks and comments are saved where Claude can read them.']
    : sync === 'connecting' ? ['bg-dim', 'Connecting', 'Connecting to the page database…']
    : ['bg-amber', 'This browser', 'The page database is not available here (for example a local preview). Picks and comments stay in this browser.']
  return (
    <Tip title={label} desc={desc} side="bottom">
      <span className="hidden items-center gap-1.5 px-1.5 text-[12px] font-semibold text-muted lg:flex" data-testid="sync"><span className={cx('h-2 w-2 rounded-full', dot)} />{label}</span>
    </Tip>
  )
}

/** Claude Code's state at a glance; opens the explainer and the send button. */
function ClaudePill({ compact }: { compact?: boolean }) {
  const claude = useStudio(s => s.claude)
  const unsent = useStudio(s => s.notes.filter(n => n.status !== 'done' && !n.sent && !n.claude).length)
  const busy = claude?.state === 'working' || claude?.state === 'reading' || claude?.state === 'publishing'
  const label = busy ? (claude!.state === 'publishing' ? 'Claude is publishing' : 'Claude is working') : unsent ? `${unsent} comment${unsent > 1 ? 's' : ''} to send` : 'Claude Code'
  return (
    <Tip title="Claude Code" desc={busy ? claude!.message || 'Working through your comments now.' : unsent ? 'You have comments Claude Code has not seen yet. Click to send them.' : 'How Claude Code picks up your comments, and its live status.'} side="bottom">
      <button type="button" onClick={() => ui.set({ overlay: 'claude' })} className={cx('flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-semibold', busy ? 'border-sky/50 bg-sky/10 text-sky' : unsent ? 'border-ember/50 bg-ember/10 text-ember' : 'border-line text-muted hover:text-fg')} data-testid="claude-pill" data-tour="claude">
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Bot size={13} />}{!compact && <span className="hidden md:inline">{label}</span>}{compact && unsent ? <span>{unsent}</span> : null}
      </button>
    </Tip>
  )
}

/** Theme, captions and auto-replay. */
function SettingsMenu() {
  const prefs = useStudio(s => s.prefs)
  const item = 'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13.5px] outline-none data-[highlighted]:bg-raise'
  return (
    <DM.Root>
      <Tip title="Settings" desc="Light or dark, captions, and whether a pick replays its moment" side="bottom">
        <DM.Trigger asChild><button type="button" className="icon-btn" aria-label="Settings" data-testid="settings"><Settings2 size={18} /></button></DM.Trigger>
      </Tip>
      <DM.Portal>
        <DM.Content className="pop z-[100] min-w-[240px] p-1.5" sideOffset={6} align="end">
          <DM.Label className="label px-2 py-1">Theme</DM.Label>
          <DM.RadioGroup value={prefs.theme} onValueChange={v => setPrefs({ theme: v as Prefs['theme'] })}>
            {([['system', 'Match claude.ai / system', Monitor], ['light', 'Light', Sun], ['dark', 'Dark', Moon]] as const).map(([v, l, I]) => (
              <DM.RadioItem key={v} value={v} className={item} data-testid={`theme-${v}`}><I size={14} />{l}{prefs.theme === v && <Check size={14} className="ml-auto text-sky" />}</DM.RadioItem>
            ))}
          </DM.RadioGroup>
          <DM.Separator className="my-1 h-px bg-line" />
          <DM.CheckboxItem checked={prefs.captions} onCheckedChange={v => setPrefs({ captions: !!v })} className={item}><Captions size={14} />Captions on the film<span className="ml-auto flex items-center gap-1">{prefs.captions && <Check size={14} className="text-sky" />}<kbd className="kbd">S</kbd></span></DM.CheckboxItem>
          <DM.CheckboxItem checked={prefs.replay} onCheckedChange={v => setPrefs({ replay: !!v })} className={item}><Repeat size={14} />Replay the moment after a pick{prefs.replay && <Check size={14} className="ml-auto text-sky" />}</DM.CheckboxItem>
          <DM.Separator className="my-1 h-px bg-line" />
          <DM.Item onSelect={() => ui.set({ overlay: 'tour' })} className={item}><Sparkles size={14} />Quick tour</DM.Item>
          <DM.Item onSelect={() => ui.set({ overlay: 'help' })} className={item}><Keyboard size={14} />Keyboard shortcuts<kbd className="kbd ml-auto">?</kbd></DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  )
}
