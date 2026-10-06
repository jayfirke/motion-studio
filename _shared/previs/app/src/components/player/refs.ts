import type { FilmViewer } from '../../engine/viewer'

/** DOM handles shared by the player's layers (composer placement, picking, fullscreen). */
export const refs: { viewer: FilmViewer | null; frame: HTMLDivElement | null; screen: HTMLDivElement | null; player: HTMLDivElement | null } = { viewer: null, frame: null, screen: null, player: null }
