// Records a scripted walkthrough of the built Previs Studio as a demo clip: a visible macOS-style cursor that eases
// between targets, a press animation on every click, natural typing, and a sidecar of every click and key press
// (times in seconds from the start of the clip) so the film can place real click and typing sounds exactly.
//
//   node scripts/record-demo.mjs <flow.mjs> --out <clip.mp4> [--film 011-crumb] [--w 1440 --h 810] [--dpr 2] [--theme dark|light]
//                               [--runtime] [--seed seed.json] [--ask-offline] [--who You] [--crf 24]
//
// A flow is an ES module: export default async function (h) { await h.move('[data-tab=choices]'); await h.click(); ... }
// It may also export `prep(h)`, which runs before recording starts (open a tab, seek, set state), so the clip opens ready.
// Helpers (h): page, sleep(ms), move(target, ms), click(target?, ms), type(text, cps), key(name), seek(t), play(), pause(),
//              box(selector) → {x,y,width,height}, part(regex) → box of the smallest scene element whose text matches, mark(name),
//              at(t) waits until t seconds into the clip, clickAt(t, target, ms) lands the press exactly at t,
//              typeAt(t, text, cps), drag(from, to, ms), db(fn) runs fn(db, filmId) against the runtime stand-in.
// The clip is W·dpr × H·dpr (default 2880 × 1620, so a 1.5× camera push in a 1920 × 1080 film stays sharp). Click events carry
// the press position in output pixels, so the film's camera can push onto each click.
// Frames come from Chrome's screencast (JPEG q90, every painted frame), re-timed to a constant 30 fps H.264 file.
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { homedir, tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../studio')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const flowPath = resolve(process.argv[2])
const out = resolve(arg('--out', 'demo.mp4'))
const film = arg('--film', '011-crumb'), W = +arg('--w', 1440), H = +arg('--h', 810), DPR = +arg('--dpr', 2), theme = arg('--theme', 'dark')
const WHO = arg('--who', ''), CRF = arg('--crf', '24')
const withRuntime = process.argv.includes('--runtime')

const CHROME = [
  join(homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => existsSync(p))
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' }
const SKELETON = b => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${b}</body></html>`
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const file = join(root, p === '/' ? 'index.html' : p)
    let body = await readFile(file)
    if (file.endsWith('index.html')) body = SKELETON(body.toString())
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body)
  } catch { res.writeHead(404); res.end('not found') }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const url = `http://127.0.0.1:${server.address().port}/#${film}`

// The cursor lives in the page so the screencast films it: an arrow that follows mouse events and presses on mousedown.
const CURSOR = (who) => {
  const mk = () => {
    if (document.getElementById('__cur')) return
    const c = document.createElement('div'); c.id = '__cur'
    // about 4.5 % of the frame height, the playbook's cursor size; an optional name tag says who is acting
    c.innerHTML = '<svg width="30" height="37" viewBox="0 0 17 21" xmlns="http://www.w3.org/2000/svg"><path d="M1 1 L1 16.2 L4.6 12.9 L7.1 18.9 L9.6 17.8 L7.1 11.9 L12.2 11.9 Z" fill="#111" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>' +
      (who ? `<span style="position:absolute;left:22px;top:30px;padding:3px 9px 4px;border-radius:999px;background:#FF6A3D;color:#1C0B04;font:700 12px/1 system-ui,sans-serif;white-space:nowrap">${who}</span>` : '')
    c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-200px,-200px);transform-origin:2px 2px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));transition:none'
    const r = document.createElement('div'); r.id = '__ring'
    r.style.cssText = 'position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid rgba(255,106,61,.9);z-index:2147483646;pointer-events:none;opacity:0;transform:scale(.3)'
    document.documentElement.append(r, c)
    let x = -200, y = -200
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; c.style.transform = `translate(${x}px,${y}px)` }, true)
    addEventListener('mousedown', () => {
      c.style.transform = `translate(${x}px,${y}px) scale(.82)`
      r.style.left = x + 'px'; r.style.top = y + 'px'
      r.animate([{ opacity: 0.95, transform: 'scale(.3)' }, { opacity: 0, transform: 'scale(1.25)' }], { duration: 420, easing: 'cubic-bezier(.2,.7,.3,1)' })
    }, true)
    addEventListener('mouseup', () => { c.style.transform = `translate(${x}px,${y}px)` }, true)
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mk); else mk()
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'] })
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR })
await ctx.addInitScript(t => { try { localStorage.setItem('studio2:toured', 'true'); localStorage.setItem('studio2:prefs', JSON.stringify({ theme: t })) } catch {} }, theme)
await ctx.addInitScript(CURSOR, WHO)
if (withRuntime) {
  const { runtimeStub } = await import(pathToFileURL(join(here, 'runtime-stub.mjs')).href)
  const seedFile = arg('--seed', '')
  const seed = seedFile ? JSON.parse(await readFile(resolve(seedFile), 'utf8')) : null
  await ctx.addInitScript(runtimeStub, seed || process.argv.includes('--ask-offline') ? { filmId: film, seed, askOffline: process.argv.includes('--ask-offline') } : film)
}
const page = await ctx.newPage()
await page.goto(url)
await page.waitForSelector('[data-testid=frame]', { timeout: 20000 })
await page.addStyleTag({ content: '*{cursor:none!important}[data-testid=bigplay]{display:none!important}' })
await page.evaluate(() => document.fonts.ready)
await new Promise(r => setTimeout(r, 900))
const flowMod = await import(pathToFileURL(flowPath).href)

// ---- screencast
const tmp = join(tmpdir(), `demo-${Date.now()}`); await mkdir(tmp, { recursive: true })
const cdp = await ctx.newCDPSession(page)
const frames = []
cdp.on('Page.screencastFrame', async f => {
  const n = frames.length, file = join(tmp, `f${String(n).padStart(6, '0')}.jpg`)
  frames.push({ file, t: f.metadata.timestamp })
  writeFile(file, Buffer.from(f.data, 'base64')).catch(() => {})
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
})
let t0 = Date.now() / 1000
const events = []
const now = () => +(Date.now() / 1000 - t0).toFixed(3)
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ---- helpers
let cx = W * 0.62, cy = H * 0.72
await page.mouse.move(cx, cy)
const ease = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
async function box(sel) { const b = await page.locator(sel).first().boundingBox(); if (!b) throw new Error('not found: ' + sel); return b }
async function part(re) {
  return page.evaluate(src => {
    const rx = new RegExp(src)
    const scene = [...document.querySelectorAll('[data-testid=frame] .fscene')].find(w => w.style.visibility === 'visible')
    const el = scene && [...scene.querySelectorAll('*')].find(e => e.children.length === 0 && rx.test(e.textContent || ''))
    if (!el) return null
    const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }
  }, re.source)
}
async function point(target) {
  if (!target) return { x: cx, y: cy }
  if (typeof target === 'object' && 'x' in target && !('width' in target)) return target
  const b = typeof target === 'string' ? await box(target) : target
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}
async function move(target, ms = 650) {
  const p = await point(target), x0 = cx, y0 = cy
  const steps = Math.max(8, Math.round(ms / 16))
  // a gentle arc, like a hand moving a mouse
  const bend = Math.min(80, Math.hypot(p.x - x0, p.y - y0) * 0.12)
  for (let i = 1; i <= steps; i++) {
    const e = ease(i / steps), arc = Math.sin(Math.PI * e) * bend
    await page.mouse.move(x0 + (p.x - x0) * e, y0 + (p.y - y0) * e - arc)
    await sleep(ms / steps)
  }
  cx = p.x; cy = p.y
}
async function click(target, ms = 650) {
  if (target) await move(target, ms)
  await sleep(90)
  events.push({ type: 'click', t: now(), x: Math.round(cx * DPR), y: Math.round(cy * DPR) })
  await page.mouse.down(); await sleep(85); await page.mouse.up()
  await sleep(160)
}
async function type(text, cps = 14) {
  for (const ch of text) {
    events.push({ type: ch === ' ' ? 'space' : 'key', t: now() })
    await page.keyboard.type(ch)
    await sleep(1000 / cps * (0.7 + Math.random() * 0.6))
  }
}
async function key(name) { events.push({ type: 'key', t: now(), name }); await page.keyboard.press(name); await sleep(120) }
const seek = t => page.evaluate(t => window.__previs.playback.seek(t), t)
const play = () => page.evaluate(() => window.__previs.playback.play())
const pause = () => page.evaluate(() => window.__previs.playback.pause())
const mark = name => events.push({ type: 'mark', name, t: now() })

async function at(t) { const w = t0 + t - Date.now() / 1000; if (w > 0) await sleep(w * 1000) }
async function clickAt(t, target, ms = 650) { await at(t - ms / 1000 - 0.09); await click(target, ms) }
async function typeAt(t, text, cps = 14) { await at(t); await type(text, cps) }
async function drag(from, to, ms = 700) {
  await move(from, 450); const a = await point(from), b = await point(to)
  events.push({ type: 'click', t: now(), x: Math.round(a.x * DPR), y: Math.round(a.y * DPR), drag: true })
  await page.mouse.down()
  const steps = Math.max(8, Math.round(ms / 16))
  for (let i = 1; i <= steps; i++) { const e = ease(i / steps); await page.mouse.move(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e); await sleep(ms / steps) }
  await page.mouse.up(); cx = b.x; cy = b.y; events.push({ type: 'release', t: now(), x: Math.round(b.x * DPR), y: Math.round(b.y * DPR) })
}
const db = fn => page.evaluate(async ([src, id]) => { const d = await window.claude.use('db'); return (0, eval)(src)(d, id) }, [fn.toString(), film])
const H_ = { page, sleep, move, click, type, key, seek, play, pause, box, part, mark, at, clickAt, typeAt, drag, db, W, H, DPR }
if (flowMod.prep) await flowMod.prep(H_)
await sleep(300)
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: Math.round(W * DPR), maxHeight: Math.round(H * DPR), everyNthFrame: 1 })
t0 = Date.now() / 1000
await flowMod.default(H_)
await sleep(400)
const t1 = Date.now() / 1000
await cdp.send('Page.stopScreencast')
await sleep(300)
await browser.close(); server.close()

// ---- re-time to constant 30 fps (each screencast frame holds until the next one)
const tStart = frames.length ? Math.min(frames[0].t, t0) : t0
let list = ''
frames.forEach((f, i) => {
  const next = i + 1 < frames.length ? frames[i + 1].t : t1
  list += `file '${f.file}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}\n`
})
if (frames.length) list += `file '${frames[frames.length - 1].file}'\n`
await writeFile(join(tmp, 'list.txt'), list)
const lead = Math.max(0, frames.length ? frames[0].t - t0 : 0)
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'),
  '-vf', `fps=30,scale=${Math.round(W * DPR / 2) * 2}:${Math.round(H * DPR / 2) * 2}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-movflags', '+faststart', out])
await writeFile(out.replace(/\.mp4$/, '.events.json'), JSON.stringify({ duration: +(t1 - t0).toFixed(3), video_starts_at: +lead.toFixed(3), w: Math.round(W * DPR), h: Math.round(H * DPR), events }, null, 1))
await rm(tmp, { recursive: true, force: true })
console.log(`${out}: ${(t1 - t0).toFixed(1)} s, ${frames.length} painted frames, ${events.filter(e => e.type === 'click').length} clicks, ${events.filter(e => e.type !== 'click' && e.type !== 'mark').length} keys`)
