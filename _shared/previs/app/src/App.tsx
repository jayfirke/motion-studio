import { useEffect } from 'react'
import * as RT from '@radix-ui/react-tooltip'
import { Toaster, toast } from 'sonner'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { loadFilms, redo, setHold, setMix, setPrefs, setView, ui, undo, useStudio } from './state/store'
import { playback } from './engine/playback'
import { audio } from './engine/audio'
import { TopBar } from './components/shell/TopBar'
import { Home } from './components/shell/Home'
import { Player } from './components/player/Player'
import { Composer } from './components/player/Composer'
import { SidePanel } from './components/side/SidePanel'
import { Storyboard } from './components/board/Storyboard'
import { Plan } from './components/plan/Plan'
import { ApproveDialog, ClaudeDialog, HelpDialog, Tour } from './components/shell/Dialogs'
import { LibraryPanel } from './components/choices/LibraryPanel'
import { useThemeSync } from './lib/theme'
import { Palette } from './components/shell/Palette'
import { stepNote, stepShot, toggleComment, toggleFull } from './components/player/Controls'
import { useDocked } from './lib/layout'
import { Boundary } from './components/Boundary'
import { store as ls } from './lib/util'

export function App() {
  const view = useStudio(s => s.view)
  const loading = useStudio(s => s.loading)
  const problems = useStudio(s => s.problems)
  const M = useStudio(s => s.M)
  const full = useStudio(s => s.full)
  const drawer = useStudio(s => s.drawer)
  const docked = useDocked()

  useEffect(() => { loadFilms() }, [])
  useEffect(() => { audio.onFail = src => toast.warning('A sound could not load', { description: `${src.split('/').pop()} is missing or damaged. The film plays without it; tell Claude.` }) ; return () => { audio.onFail = null } }, [])
  useKeys()
  useThemeSync()
  useEffect(() => {
    const h = () => { if (!document.fullscreenElement && ui.get().full) ui.set({ full: false }) }
    document.addEventListener('fullscreenchange', h); return () => document.removeEventListener('fullscreenchange', h)
  }, [])
  useEffect(() => { if (M && view === 'watch' && !ls.get('studio2:toured')) { const id = setTimeout(() => { if (!ui.get().overlay) ui.set({ overlay: 'tour' }) }, 900); return () => clearTimeout(id) } }, [M, view])
  useEffect(() => { if (view !== 'watch' && ui.get().playing && !playback.shotPlaying) playback.pause() }, [view])
  useEffect(() => { document.title = M ? `${M.D.project.product} · Previs Studio` : 'Previs Studio' }, [M])

  let body: React.ReactNode
  if (loading) body = <Center><Loader2 className="animate-spin text-dim" size={26} /><span className="text-muted">Loading the film…</span></Center>
  else if (view === 'home') body = <Home />
  else if (problems) body = <Problems list={problems} />
  else if (!M) body = <Home />
  else if (view === 'board') body = <Storyboard />
  else if (view === 'plan') body = <Plan />
  else body = (
    <div className="flex min-h-0 min-w-0 flex-1">
      <div className="min-h-0 min-w-0 flex-1"><Player /></div>
      {docked && <div className="w-[clamp(320px,34vw,420px)] shrink-0"><SidePanel /></div>}
    </div>
  )

  return (
    <RT.Provider delayDuration={380} skipDelayDuration={200}>
      <div className="flex h-dvh flex-col overflow-hidden bg-ink text-fg">
        {!full && <TopBar />}
        <main className="flex min-h-0 flex-1"><Boundary key={view} label={view === 'board' ? 'storyboard' : view === 'plan' ? 'plan' : view === 'home' ? 'film list' : 'player'}>{body}</Boundary></main>
        {M && drawer && !docked && <SidePanel drawer />}
        <Composer />
        <ApproveDialog />
        <ClaudeDialog />
        <LibraryPanel />
        <HelpDialog />
        <Palette />
        <Tour />
        <Toaster theme="dark" position="top-center" offset={64} toastOptions={{ style: { background: 'var(--color-raise)', border: '1px solid var(--color-line2)', color: 'var(--color-fg)', fontFamily: 'var(--font-sans)' } }} />
      </div>
    </RT.Provider>
  )
}

function Center({ children }: { children: React.ReactNode }) { return <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[14px]">{children}</div> }

function Problems({ list }: { list: string[] }) {
  return (
    <Center>
      <div className="card mx-4 max-w-[560px] p-5">
        <div className="flex items-center gap-2 text-amber"><AlertTriangle size={18} /><b className="text-[16px] text-fg">This film's data has a problem</b></div>
        <p className="mt-1.5 text-[13.5px] text-muted">The studio could not open it. Send this list to Claude to fix the data pack:</p>
        <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-[13px]">{list.slice(0, 12).map((p, i) => <li key={i} className="mono break-words">{p}</li>)}</ul>
        <button type="button" className="btn btn-sm mt-4" onClick={() => setView('home')}>All films</button>
      </div>
    </Center>
  )
}

/** The keyboard map. Ignored while typing. */
function useKeys() {
  useEffect(() => {
    const typing = (e: KeyboardEvent) => { const t = e.target as HTMLElement; return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) }
    const down = (e: KeyboardEvent) => {
      const s = ui.get(); if (!s.M || !s.C) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); ui.set({ overlay: s.overlay === 'palette' ? null : 'palette' }); return }
      if (typing(e) || s.overlay) return
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return }
      if (mod || e.altKey) return
      const fps = s.M.D.project.fps || 30
      const watching = s.view === 'watch'
      audio.ensure()
      switch (e.key) {
        case ' ': if (!watching) return; e.preventDefault(); playback.toggle(); return
        case 'k': case 'K': if (watching) playback.toggle(); return
        case 'ArrowLeft': if (!watching) return; e.preventDefault(); playback.seek(s.T - (e.shiftKey ? 1 : 1 / fps)); return
        case 'ArrowRight': if (!watching) return; e.preventDefault(); playback.seek(s.T + (e.shiftKey ? 1 : 1 / fps)); return
        case 'j': case 'J': if (watching) playback.seek(s.T - 2); return
        case 'l': case 'L': if (watching) playback.seek(s.T + 2); return
        case '[': if (watching) stepShot(-1); return
        case ']': if (watching) stepShot(1); return
        case 'Home': if (watching) { e.preventDefault(); playback.seek(0) } return
        case 'End': if (watching) { e.preventDefault(); playback.seek(s.C.total) } return
        case 'c': case 'C': if (watching) toggleComment(); return
        case 'p': case 'P': if (s.mode === 'comment') ui.set({ tool: 'pen' }); return
        case 'a': case 'A': if (s.mode === 'comment') ui.set({ tool: 'arrow' }); return
        case 'v': case 'V': if (s.mode === 'comment') ui.set({ tool: 'point' }); return
        case 'n': case 'N': if (watching) stepNote(e.shiftKey ? -1 : 1); return
        case 'f': case 'F': if (watching) toggleFull(); return
        case 'm': case 'M': setMix({ muted: !s.mix.muted }); return
        case 's': case 'S': if (watching) setPrefs({ captions: !s.prefs.captions }); return
        case '\\': if (!e.repeat) setHold(true); return
        case '?': ui.set({ overlay: 'help' }); return
        case '1': setView('watch'); return
        case '2': setView('board'); return
        case '3': setView('plan'); return
        case 'Escape':
          if (s.draft) { ui.set({ draft: null, tool: 'point' }); return }
          if (s.library) { ui.set({ library: null }); return }
          if (s.mode === 'comment') { ui.set({ mode: 'watch', tool: 'point' }); return }
          if (s.compare) { ui.set({ compare: null }); playback.pause(); return }
          if (s.drawer) { ui.set({ drawer: false }); return }
          if (s.full) { toggleFull(); return }
          return
      }
    }
    const up = (e: KeyboardEvent) => { if (e.key === '\\') setHold(false) }
    const unlock = () => audio.ensure()
    addEventListener('keydown', down); addEventListener('keyup', up); addEventListener('pointerdown', unlock, { once: true })
    return () => { removeEventListener('keydown', down); removeEventListener('keyup', up); removeEventListener('pointerdown', unlock) }
  }, [])
}
