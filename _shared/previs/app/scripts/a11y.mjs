// Accessibility audit of the built page with axe-core: the studio chrome only (the film frame is artwork).
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../studio')
const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js')
const CHROME = [join(homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')].find(p => existsSync(p))
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg' }
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname), file = join(root, p === '/' ? 'index.html' : p)
    let body = await readFile(file)
    if (file.endsWith('index.html')) body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${body}</body></html>`
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }); res.end(body)
  } catch { res.writeHead(404); res.end() }
})
await new Promise(r => server.listen(0, '127.0.0.1', r))
const url = `http://127.0.0.1:${server.address().port}/`
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
let total = 0
for (const theme of ['light', 'dark']) {
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(t => { try { localStorage.setItem('studio2:toured', 'true'); localStorage.setItem('studio2:prefs', JSON.stringify({ theme: t, captions: false, replay: true })) } catch {} }, theme)
const page = await ctx.newPage()
async function audit(page, name) {
  await page.addScriptTag({ path: axePath })
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { exclude: [['.fstage']], resultTypes: ['violations'] })
    return res.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n').slice(1, 2).join(' ')) }))
  })
  total += r.length
  console.log(`\n${name}: ${r.length} serious/critical`)
  r.forEach(v => { console.log(`- ${v.id} (${v.impact}): ${v.help}`); v.nodes.forEach(n => console.log(`    ${n}`)) })
}
await page.goto(url); await page.waitForSelector('[data-testid=frame]'); await new Promise(r => setTimeout(r, 600))
await audit(page, `${theme}: watch + guide`)
await page.locator('[data-tab=choices]').click(); await audit(page, `${theme}: watch + choices`)
await page.locator('[data-tab=notes]').click(); await audit(page, `${theme}: watch + notes`)
await page.keyboard.press('2'); await new Promise(r => setTimeout(r, 500)); await audit(page, `${theme}: storyboard`)
await page.keyboard.press('3'); await new Promise(r => setTimeout(r, 400)); await audit(page, `${theme}: plan`)
await ctx.close()
}
await browser.close(); server.close()
console.log(`\nTotal serious/critical: ${total}`)
process.exit(total ? 1 : 0)
