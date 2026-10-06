import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import { App } from './App'
import { audio } from './engine/audio'
import { playback } from './engine/playback'
import { useStudio } from './state/store'

// Read-only handles for automated checks (scheduled sounds, current state). Not used by the app itself.
;(window as unknown as { __previs: unknown }).__previs = { audio, playback, state: () => useStudio.getState() }

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
