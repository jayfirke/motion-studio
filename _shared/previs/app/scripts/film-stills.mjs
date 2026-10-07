// Stills of every scene of a per-film previs page, for a contact sheet: node scripts/film-stills.mjs <page-dir> <out-dir> [--at key|0.5|...]
// Serves the page folder, seeks to each scene's key moment (or a fraction of it), waits for clips to land, screenshots the frame.
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
const [dir, out] = [resolve(process.argv[2]), resolve(process.argv[3])]
const atArg = (i => (i > 0 ? process.argv[i + 1] : 'key'))(process.argv.indexOf('--at'))
await mkdir(out, { recursive: true })
const CHROME = [join(homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'), '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => existsSync(p))
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4', '.svg': 'image/svg+xml' }
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname); const f = join(dir, p === '/' ? 'index.html' : p)
    let b = await readFile(f); if (f.endsWith("index.html")) b = Buffer.from(`<!doctype html><html><head><meta charset="utf-8"></head><body>${b}</body></html>`)
    const type = TYPES[extname(f)] || 'application/octet-stream', m = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '')
    if (m) {   // byte ranges, like a real host, so clips can seek anywhere before they have fully loaded
      const a = +m[1], z = m[2] ? Math.min(+m[2], b.length - 1) : b.length - 1
      res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${a}-${z}/${b.length}`, 'content-length': z - a + 1 }); res.end(b.subarray(a, z + 1)); return
    }
    res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': b.length }); res.end(b)
  } catch { res.writeHead(404); res.end() }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 })
await ctx.addInitScript(() => { try { localStorage.setItem('studio2:toured', 'true') } catch {} })
const page = await ctx.newPage()
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
await page.goto(`http://127.0.0.1:${server.address().port}/`)
await page.waitForSelector('[data-testid=frame]', { timeout: 20000 })
await page.addStyleTag({ content: '[data-sonner-toaster],[data-testid=bigplay]{display:none!important}' })
await page.evaluate(() => document.fonts.ready); await new Promise(r => setTimeout(r, 800))
const D = await (await fetch(`http://127.0.0.1:${server.address().port}/previs.json`)).json()
let t = 0
for (const [i, sc] of D.scenes.entries()) {
  const u = atArg === 'key' ? (sc.key ?? sc.dur * 0.6) : sc.dur * parseFloat(atArg)
  await page.evaluate(x => { window.__previs.playback.pause?.(); window.__previs.playback.seek(x) }, t + u)
  await new Promise(r => setTimeout(r, 400))
  // wait until every visible clip has finished seeking and has a decoded frame (big recordings can take a moment)
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid=frame] .fscene video')]
    .filter(v => v.closest('.fscene').style.visibility === 'visible').every(v => !v.seeking && v.readyState >= 2), null, { timeout: 8000 }).catch(() => {})
  // headless Chrome may keep showing an old frame of a paused clip after a seek, so each visible clip is drawn into an
  // image laid exactly over it for the screenshot (removed right after)
  await page.evaluate(() => { for (const v of [...document.querySelectorAll('[data-testid=frame] .fscene video')].filter(v => v.closest('.fscene').style.visibility === 'visible')) {
    if (!v.videoWidth) continue
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0)
    const cs = getComputedStyle(v), im = document.createElement('img'); im.className = '__snap'; im.src = c.toDataURL('image/jpeg', 0.9)
    Object.assign(im.style, { position: 'absolute', left: v.offsetLeft + 'px', top: v.offsetTop + 'px', width: v.offsetWidth + 'px', height: v.offsetHeight + 'px', objectFit: cs.objectFit, filter: cs.filter, borderRadius: cs.borderRadius, zIndex: cs.zIndex })
    v.after(im); v.style.visibility = 'hidden'
  } })
  await new Promise(r => setTimeout(r, 250))
  await page.locator('[data-testid=frame]').screenshot({ path: join(out, `${String(i + 1).padStart(2, '0')}-${sc.id}.jpg`), type: 'jpeg', quality: 80 })
  await page.evaluate(() => { document.querySelectorAll('.__snap').forEach(i => { i.previousElementSibling.style.visibility = ''; i.remove() }) })
  t += sc.dur
}
console.log(`${D.scenes.length} stills in ${out}; errors: ${errs.length ? errs.slice(0, 5).join(' | ') : 'none'}`)
await browser.close(); server.close()
