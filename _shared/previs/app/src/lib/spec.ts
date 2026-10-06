import { ui } from '../state/store'
import { cleanText, optLabel } from '../data/model'

/** The production spec as it would be frozen right now: every pick resolved to what the engine builds. */
export function currentSpec() {
  const { M, C, picks, tweaks, custom, approval, film } = ui.get()
  if (!M || !C) return null
  const o = (k: string) => C.o(k)
  const dir = o('direction'), music = o('music'), motion = o('motion'), pacing = o('pacing'), voice = o('voice')
  return {
    film: film?.id, product: M.D.project.product, version: M.D.versions?.slice(-1)[0]?.v, approved: !!approval?.approved,
    format: `${M.D.project.w}x${M.D.project.h} @ ${M.D.project.fps || 30} fps`, runtime: +C.total.toFixed(2), engine: M.D.pipeline?.engine || M.D.engine?.name,
    look: { pick: picks.direction, name: optLabel(dir), tokens: dir?.tokens, fonts_url: dir?.fonts_url },
    music: { pick: picks.music, name: optLabel(music), src: music?.src, bpm: music?.bpm, licence: music?.lic },
    motion: { pick: picks.motion, name: optLabel(motion), ease: motion?.ease, spring: motion?.spring, bezier: motion?.bezier },
    pacing: { pick: picks.pacing, name: optLabel(pacing), scale: pacing?.scale },
    voice: { pick: picks.voice, name: voice?.name, fish_voice_id: voice?.voice, language: voice?.lang, accent: voice?.accent },
    mix: { voice_db: tweaks['lane.vo']?.db || 0, music_db: tweaks['lane.music']?.db || 0, sfx_db: tweaks['lane.sfx']?.db || 0, duck_music_under_voice: tweaks['mix.duck']?.on !== false },
    shots: C.TL.map(r => {
      const v = C.vo().find(x => x.r.sc.id === r.sc.id)
      return {
        id: r.sc.id, name: r.sc.name, start: +r.start.toFixed(3), dur: +(r.end - r.start).toFixed(3),
        transition: optLabel(o(`${r.sc.id}.transition`)) || null, camera: optLabel(o(`${r.sc.id}.camera`)) || null,
        line: v ? { pick: v.o.id, text: cleanText(v.o.text), at: +v.a.toFixed(3), src: v.o.src, needs_recording: v.missing } : null,
        sfx: C.sfx().filter(s => s.r.sc.id === r.sc.id && s.o?.src).map(s => ({ id: s.x.id, label: s.x.label, at: +s.a.toFixed(3), pick: optLabel(s.o), src: s.o!.src, gain: +s.g.toFixed(3) })),
      }
    }),
    added_options: Object.fromEntries(Object.entries(custom).map(([k, list]) => [k, list.map(x => ({ id: x.id, name: optLabel(x), origin: x.origin, needs: x.needs }))])),
  }
}
