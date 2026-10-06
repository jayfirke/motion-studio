import { audio } from './audio'
import type { FilmViewer } from './viewer'
import type { Ctx } from '../data/model'
import { ui } from '../state/store'
import { clamp } from '../lib/util'

interface ShotTarget { viewer: FilmViewer; onFrame: (t: number) => void; onEnd: () => void }

// One clock for everything that plays: the main film, the compare pair, or a single storyboard shot.
// Picture follows the audio clock when sound is running, so lips, hits and cuts stay in sync.
class Playback {
  main: FilmViewer | null = null
  extra = new Set<FilmViewer>()
  audioCtx: (() => Ctx | null) | null = null
  lastC: Ctx | null = null
  private raf = 0
  private t0 = 0
  private c0 = 0
  private curT = 0
  private audioClock = false
  private from = 0
  private until: number | null = null
  private token = 0
  private target: ShotTarget | null = null
  private loopRange = false

  render(t: number) {
    const s = ui.get(); if (!s.C) return
    t = clamp(t, 0, s.C.total)
    this.curT = t
    if (this.target) { this.target.onFrame(t); return }
    this.main?.paint(t)
    this.extra.forEach(v => v.paint(t))
    ui.set({ T: t })
  }

  /** Plays the main film from `from` (default: the playhead) and stops at `until` (default: the end). */
  async play(from?: number, until?: number, loop = false) {
    const s = ui.get(); if (!s.C) return
    if (this.target) this.endShot()
    let t = from ?? s.T
    if (t >= (until ?? s.C.total) - 0.02) t = 0
    this.from = t; this.until = until ?? null; this.loopRange = loop
    await this.run(t)
  }

  private async run(t: number) {
    const s = ui.get(); if (!s.C) return
    const tok = ++this.token
    this.render(t)
    ui.set({ playing: true })
    const C = (this.audioCtx && this.audioCtx()) || s.C
    this.lastC = C
    const c0 = await audio.start(C, t, s.mix, s.rate, this.target ? { a: t, b: this.until ?? s.C.total } : undefined)
    if (tok !== this.token) return
    this.t0 = t
    this.audioClock = c0 != null
    this.c0 = c0 ?? performance.now() / 1000
    cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(this.tick)
  }

  private tick = () => {
    const s = ui.get(); if (!s.playing || !s.C) return
    const now = this.audioClock ? audio.now() : performance.now() / 1000
    const t = this.t0 + Math.max(0, now - this.c0) * s.rate
    const end = this.until ?? s.C.total
    if (t >= end) {
      if ((s.loop || this.loopRange) && !this.target) { this.run(this.from); return }
      if (this.target) { this.render(end); this.endShot(); return }
      this.halt(); this.render(end)
      return
    }
    this.render(t)
    this.raf = requestAnimationFrame(this.tick)
  }

  private halt() { this.token++; cancelAnimationFrame(this.raf); audio.stop(); if (ui.get().playing) ui.set({ playing: false }) }
  pause() { this.loopRange = false; if (this.target) this.endShot(); else this.halt() }
  seek(t: number) {
    if (this.target) this.endShot()
    const was = ui.get().playing
    this.halt(); this.until = null; this.loopRange = false; this.render(t)
    if (was) this.play()
  }
  toggle() { if (ui.get().playing) this.pause(); else this.play() }
  /** Re-schedules sound after a change (a new pick, the speed, the compare side). No-op if nothing changed. */
  restart(force = false) {
    const s = ui.get()
    if (!s.playing) { if (!this.target) this.render(s.T); return }
    const C = (this.audioCtx && this.audioCtx()) || s.C
    if (!force && C === this.lastC) return
    this.run(this.curT)
  }

  /** Plays one storyboard shot inside its own card; the card paints its frames. */
  async playShot(viewer: FilmViewer, a: number, b: number, onFrame: (t: number) => void, onEnd: () => void) {
    if (this.target) this.endShot(); else this.halt()
    this.target = { viewer, onFrame, onEnd }
    this.from = a; this.until = b
    await this.run(a)
  }
  endShot() { const tgt = this.target; this.target = null; this.halt(); tgt?.onEnd() }
  shotActive(v: FilmViewer) { return this.target?.viewer === v }
  get shotPlaying() { return !!this.target }
}

export const playback = new Playback()
