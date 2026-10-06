import { useStudio } from '../state/store'
import { useMedia } from './hooks'

/** The review panel docks beside the player when there is room: always on wide screens,
 *  and on tablets too when the film is portrait (a 9:16 frame is limited by height, not width). */
export function useDocked() {
  const wide = useMedia('(min-width: 1080px)')
  const mid = useMedia('(min-width: 760px)')
  const portrait = useStudio(s => (s.M ? s.M.D.project.h > s.M.D.project.w : false))
  const view = useStudio(s => s.view)
  const full = useStudio(s => s.full)
  return view === 'watch' && !full && (wide || (mid && portrait))
}
