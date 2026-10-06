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
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.mp4': 'video/mp4' }
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname); const f = join(dir, p === '/' ? 'index.html' : p)
    let b = await readFile(f); if (f.endsWith('index.html')) b = `<!doctype html><html><head><meta charset="utf-8"></head><body>${b}</body></html>`
    res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(b)
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
  await new Promise(r => setTimeout(r, 700))
  await page.locator('[data-testid=frame]').screenshot({ path: join(out, `${String(i + 1).padStart(2, '0')}-${sc.id}.jpg`), type: 'jpeg', quality: 80 })
  t += sc.dur
}
console.log(`${D.scenes.length} stills in ${out}; errors: ${errs.length ? errs.slice(0, 5).join(' | ') : 'none'}`)
await browser.close(); server.close()
