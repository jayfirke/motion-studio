// Review render of a per-film previs page, played in real time the way a reviewer sees it:
//   node scripts/film-review.mjs <page-dir> <out.mp4> [--sfx-stem out.wav [--lane sfx|music|vo]] [--from 0] [--to <s>]
// The film frame is pinned to a 1920 × 1080 viewport, the page plays from --from, Chrome's screencast keeps every painted
// frame (so real stalls and lag show up as held frames), and the page's own Web Audio master is recorded with a
// MediaRecorder (so the mix is exactly the page's: duck, lane levels, every sound). Frames are re-timed to 30 fps on the
// playback clock and muxed with the audio. With --sfx-stem, a second pass records the sound-effects lane alone (no picture),
// for measuring each sound against its picture event. Prints dropped video frames and long paint gaps.
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const dir = resolve(process.argv[2]), out = resolve(process.argv[3])
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const sfxStem = arg('--sfx-stem', ''), FROM = +arg('--from', 0), LANE = arg('--lane', 'sfx')   // --lane music|vo|sfx: which lane the stem pass records
const CHROME = [join(homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'), '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => existsSync(p))
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.svg': 'image/svg+xml' }
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname); const f = join(dir, p === '/' ? 'index.html' : p)
    let b = await readFile(f); if (f.endsWith('index.html')) b = Buffer.from(`<!doctype html><html><head><meta charset="utf-8"></head><body>${b}</body></html>`)
    const type = TYPES[extname(f)] || 'application/octet-stream', m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '')
    if (m) { const a = +m[1], z = m[2] ? Math.min(+m[2], b.length - 1) : b.length - 1
      res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${z}/${b.length}`, 'content-length': z - a + 1 }); res.end(b.subarray(a, z + 1)); return }
    res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': b.length }); res.end(b)
  } catch { res.writeHead(404); res.end() }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const URL_ = `http://127.0.0.1:${server.address().port}/`
const D = JSON.parse(await readFile(join(dir, 'previs.json'), 'utf8'))
const TOTAL = D.scenes.reduce((a, s) => a + s.dur, 0), TO = +arg('--to', TOTAL)
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function open() {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  await ctx.addInitScript(() => { try { localStorage.setItem('studio2:toured', 'true') } catch {} })
  const page = await ctx.newPage()
  await page.goto(URL_)
  await page.waitForSelector('[data-testid=frame]', { timeout: 20000 })
  await page.addStyleTag({ content: '[data-testid=frame]{position:fixed!important;left:0!important;top:0!important;width:1920px!important;height:1080px!important;max-width:none!important;max-height:none!important;z-index:2147483000!important;border-radius:0!important;margin:0!important}[data-sonner-toaster],[data-testid=bigplay]{display:none!important}*{cursor:none!important}' })
  await page.evaluate(() => document.fonts.ready); await sleep(1500)
  return { ctx, page }
}

// in-page: tap the master bus into a MediaRecorder; resolve with base64 webm on stop
const REC = () => {
  const A = window.__previs.audio; A.ensure()
  const ac = A.ac, dst = ac.createMediaStreamDestination(); A.bus.master.connect(dst)
  const mr = new MediaRecorder(dst.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 256000 }), parts = []
  mr.ondataavailable = e => parts.push(e.data)
  window.__rec = { mr, done: new Promise(r => { mr.onstop = async () => { const b = new Blob(parts); const buf = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); r(btoa(s)) } }) }
  return ac.resume().then(() => { mr.start(1000); return Date.now() / 1000 })
}

async function pass(withPicture, solo) {
  const { ctx, page } = await open()
  if (solo) await page.evaluate(l => { const A = window.__previs.audio; A.ensure(); A.applyMix({ ...window.__previs.state().mix, solo: l }) }, solo)
  await page.evaluate(x => { window.__previs.playback.pause?.(); window.__previs.playback.seek(x) }, FROM); await sleep(1200)
  const tmp = join(tmpdir(), `review-${Date.now()}`); await mkdir(tmp, { recursive: true })
  const frames = []; let cdp
  if (withPicture) {
    cdp = await ctx.newCDPSession(page)
    cdp.on('Page.screencastFrame', async f => {
      const file = join(tmp, `f${String(frames.length).padStart(6, '0')}.jpg`); frames.push({ file, t: f.metadata.timestamp })
      writeFile(file, Buffer.from(f.data, 'base64')).catch(() => {}); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
    })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 })
  }
  const recT0 = await page.evaluate(REC)
  // paint-gap probe: the longest gaps between animation frames while playing
  await page.evaluate(() => { const g = window.__gaps = []; let last = performance.now(); const f = n => { const d = n - last; if (d > 50) g.push([+(window.__previs.state().T || 0).toFixed(2), +d.toFixed(0)]); last = n; requestAnimationFrame(f) }; requestAnimationFrame(f) })
  const playT0 = await page.evaluate(x => { window.__previs.playback.play(x); return Date.now() / 1000 }, FROM)
  await sleep((TO - FROM) * 1000 + 600)
  const stats = await page.evaluate(() => {
    window.__previs.playback.pause?.()
    const v = [...document.querySelectorAll('[data-testid=frame] video')]
    return { dropped: v.reduce((a, x) => a + (x.getVideoPlaybackQuality?.().droppedVideoFrames || 0), 0), total: v.reduce((a, x) => a + (x.getVideoPlaybackQuality?.().totalVideoFrames || 0), 0), gaps: window.__gaps.sort((a, b) => b[1] - a[1]).slice(0, 12) }
  })
  if (cdp) await cdp.send('Page.stopScreencast')
  await page.evaluate(() => window.__rec.mr.stop())
  const b64 = await page.evaluate(() => window.__rec.done)
  await writeFile(join(tmp, 'a.webm'), Buffer.from(b64, 'base64'))
  await ctx.close()
  return { tmp, frames, recT0, playT0, stats }
}

const A = await pass(true, null)
const lead = A.playT0 - A.recT0, dur = TO - FROM
// picture: each frame holds until the next, on the playback clock (0 = play pressed)
let list = ''; const fr = A.frames.filter(f => f.t >= A.playT0 - 0.5)
fr.forEach((f, i) => { const nx = i + 1 < fr.length ? fr[i + 1].t : A.playT0 + dur; list += `file '${f.file}'\nduration ${Math.max(0.001, nx - Math.max(f.t, A.playT0)).toFixed(4)}\n` })
if (fr.length) list += `file '${fr[fr.length - 1].file}'\n`
await writeFile(join(A.tmp, 'list.txt'), list)
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(A.tmp, 'list.txt'), '-ss', String(Math.max(0, lead - lead)), '-i', join(A.tmp, 'a.webm'),
  '-filter_complex', `[0:v]fps=30,format=yuv420p,trim=0:${dur.toFixed(3)}[v];[1:a]atrim=start=${lead.toFixed(3)},asetpts=PTS-STARTPTS,atrim=0:${dur.toFixed(3)},aresample=48000[a]`,
  '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', out])
console.log(`${out}: ${dur.toFixed(1)} s, ${A.frames.length} painted frames (${(A.frames.length / dur).toFixed(1)} per second), audio lead ${lead.toFixed(3)} s`)
console.log(`video frames dropped by the page's clips: ${A.stats.dropped} of ${A.stats.total}; longest paint gaps (film time s, ms): ${JSON.stringify(A.stats.gaps)}`)
await rm(A.tmp, { recursive: true, force: true })
if (sfxStem) {
  const B = await pass(false, LANE)
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', join(B.tmp, 'a.webm'), '-af', `atrim=start=${(B.playT0 - B.recT0).toFixed(3)},asetpts=PTS-STARTPTS,atrim=0:${dur.toFixed(3)}`, '-ar', '48000', resolve(sfxStem)])
  console.log(`${sfxStem}: the ${LANE} lane alone`)
  await rm(B.tmp, { recursive: true, force: true })
}
await browser.close(); server.close()
