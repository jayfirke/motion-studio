// Curated screenshots of the built Previs Studio for the README and for films about it: 2x resolution,
// clean states (no toasts), paused on chosen frames, with a stand-in for the claude.ai runtime so the
// Claude Code bridge shows its live states.
// Usage: node scripts/gallery.mjs [--out <dir>] [--film <id>] [--w 1600 --h 1000]
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../studio')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const out = resolve(arg('--out', join(here, '../gallery-out')))
const film = arg('--film', '011-crumb')
const W = +arg('--w', 1600), H = +arg('--h', 1000)
await mkdir(out, { recursive: true })

const CHROME = [
  join(homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => existsSync(p))
const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' }
const SKELETON = b => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>${b}</body></html>`
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
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
const sleep = ms => new Promise(r => setTimeout(r, ms))
const done = []

// A stand-in for the claude.ai runtime: page database with live snapshots, comments bridge, AI director.
function runtime(filmId) {
  return () => {
    try { localStorage.setItem('studio2:toured', 'true') } catch {}
    const docs = new Map(), subs = new Set()
    const snap = (id, data) => ({ id, exists: data !== undefined, data: () => data })
    const fire = () => subs.forEach(f => f())
    const kids = path => [...docs.entries()].filter(([k]) => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/'))
    const docRef = path => ({
      get: async () => snap(path.split('/').pop(), docs.get(path)),
      set: async d => { docs.set(path, JSON.parse(JSON.stringify(d))); fire() },
      update: async d => { docs.set(path, { ...(docs.get(path) || {}), ...JSON.parse(JSON.stringify(d)) }); fire() },
      delete: async () => { docs.delete(path); fire() },
      onSnapshot: n => { const f = () => n(snap(path.split('/').pop(), docs.get(path))); subs.add(f); f(); return () => subs.delete(f) },
    })
    let seq = 0
    const db = {
      doc: docRef,
      collection: path => ({
        doc: id => docRef(`${path}/${id || 'd' + ++seq}`),
        add: async d => { const id = 'n' + ++seq; docs.set(`${path}/${id}`, JSON.parse(JSON.stringify(d))); fire(); return docRef(`${path}/${id}`) },
        onSnapshot: n => { const f = () => n({ docs: kids(path).map(([k, v]) => snap(k.split('/').pop(), v)) }); subs.add(f); f(); return () => subs.delete(f) },
      }),
    }
    const sample = async (input, opts = {}) => { const text = 'Here you go.'; opts.onText?.({ text, delta: text }); return { text } }
    sample.limits = async () => ({ tools: { maxTools: 8 } })
    sample.json = async () => ({ reply: 'Here you go.', actions: [] })
    window.__mockdb = docs
    const comments = { canSendToClaude: async () => 'available', anchorFor: async () => ({ path: 'x', x: 0, y: 0 }), sendToClaude: async t => { window.__sent = t.text; return { threadId: 't1', commentId: 'c1' } }, openComposer: async () => ({ opened: true }) }
    window.claude = { use: async n => (n === 'db' ? db : n === 'sample' ? sample : n === 'comments' ? comments : n === 'user' ? { id: async () => 'u_demo', isOwner: async () => true, can: async () => true } : null) }
    window.__filmId = filmId
  }
}

async function open({ w = W, h = H, rt = false, theme = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 })
  await ctx.addInitScript(rt ? runtime(film) : () => { try { localStorage.setItem('studio2:toured', 'true') } catch {} })
  if (theme) await ctx.addInitScript(t => { try { localStorage.setItem('studio2:prefs', JSON.stringify({ theme: t })) } catch {} }, theme)
  const page = await ctx.newPage()
  await page.goto(url)
  await page.waitForSelector('[data-testid=frame]', { timeout: 20000 })
  await page.addStyleTag({ content: '[data-sonner-toaster],[data-testid=bigplay]{display:none!important}' })
  await sleep(900)
  return { ctx, page }
}
const seek = (page, t) => page.evaluate(t => { window.__previs.playback.pause?.(); window.__previs.playback.seek(t) }, t)
const shot = async (page, name) => { await sleep(250); await page.screenshot({ path: join(out, `${name}.png`) }); done.push(name) }
const frameBox = page => page.locator('[data-testid=frame]').boundingBox()
const partBox = (page, re) => page.evaluate(src => {
  const rx = new RegExp(src)
  const scene = [...document.querySelectorAll('[data-testid=frame] .fscene')].find(w => w.style.visibility === 'visible')
  const el = scene && [...scene.querySelectorAll('*')].find(e => e.children.length === 0 && rx.test(e.textContent || ''))
  if (!el) return null
  const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }
}, re.source)

/* Watch, choices, compare, comments, guide, library, ask, approve (dark, local) */
{
  const { ctx, page } = await open()
  await seek(page, 3.4); await page.locator('[data-tab=choices]').click(); await page.getByRole('button', { name: 'Film', exact: true }).click()
  await shot(page, 'watch')
  await page.locator('[data-choice=direction]').getByRole('button', { name: 'Compare' }).click(); await sleep(500)
  await seek(page, 3.4); await shot(page, 'compare-looks')
  await page.keyboard.press('Escape'); await sleep(200)
  await page.locator('[data-choice=motion]').getByRole('button', { name: 'Compare' }).click(); await sleep(900)
  await shot(page, 'compare-motion')
  await page.getByRole('button', { name: 'Done' }).click(); await sleep(200)
  // point at the smallest part, then write the note
  await seek(page, 2.4); await page.keyboard.press('c'); await sleep(200)
  const tb = await partBox(page, /186/)
  if (tb) {
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2); await sleep(200)
    await shot(page, 'comment-point')
    await page.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2); await page.waitForSelector('[data-testid=composer]')
    await page.keyboard.type('Make the total land bigger, with a real click.')
    await shot(page, 'comment-write')
    await page.keyboard.press('Enter'); await sleep(300)
  }
  const fr = await frameBox(page)
  await page.mouse.move(fr.x + fr.width * 0.18, fr.y + fr.height * 0.36)
  await page.mouse.down(); await page.mouse.move(fr.x + fr.width * 0.82, fr.y + fr.height * 0.58, { steps: 10 }); await page.mouse.up()
  await page.waitForSelector('[data-testid=composer]'); await shot(page, 'comment-box')
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await sleep(200)
  await page.locator('[data-tab=steps]').click(); await page.click('[data-testid=start-steps]'); await sleep(300)
  await page.click('[data-testid=next-step]'); await sleep(300); await shot(page, 'guide')
  await page.locator('[data-tab=choices]').click(); await page.getByRole('button', { name: 'Film', exact: true }).click()
  await page.click('[data-testid="more-direction"]'); await page.waitForSelector('[data-testid=library]'); await sleep(400)
  await shot(page, 'more-options')
  await page.keyboard.press('Escape'); await sleep(200)
  await page.locator('[data-tab=ask]').click()
  await page.fill('textarea[aria-label="Ask the director"]', 'I want music that is simple and sober'); await page.keyboard.press('Enter'); await sleep(900)
  await shot(page, 'ask')
  await page.evaluate(() => document.activeElement?.blur()); await page.keyboard.press('2'); await page.waitForSelector('[data-testid=board]'); await sleep(600); await shot(page, 'storyboard')
  await page.click('[data-testid=sheet-2]'); await page.waitForSelector('[data-testid=shot-sheet]'); await sleep(500); await shot(page, 'shot-sheet')
  await page.keyboard.press('Escape'); await sleep(200)
  await page.click('[data-layout=strip]'); await sleep(400); await shot(page, 'storyboard-strip')
  await page.keyboard.press('3'); await page.waitForSelector('[data-testid=plan]'); await sleep(500); await shot(page, 'plan')
  await page.keyboard.press('1'); await page.waitForSelector('[data-testid=frame]'); await seek(page, 3.4)
  await page.click('[data-testid=approve]'); await sleep(400); await shot(page, 'approve')
  await ctx.close()
}

/* Claude Code bridge (with the runtime stand-in): a note sent, Claude working, the note done, activity */
{
  const { ctx, page } = await open({ rt: true })
  await seek(page, 1.8); await page.keyboard.press('c'); await sleep(200)
  const fr = await frameBox(page)
  await page.mouse.click(fr.x + fr.width / 2, fr.y + fr.height * 0.2); await page.waitForSelector('[data-testid=composer]')
  await page.keyboard.type('Headline a touch smaller.'); await page.keyboard.press('Enter'); await sleep(400)
  await page.keyboard.press('Escape')
  await page.locator('[data-tab=notes]').click(); await sleep(300)
  await shot(page, 'notes')
  await page.click('[data-testid=send-claude]'); await sleep(600)
  await page.evaluate(async id => {
    const db = await window.claude.use('db')
    await db.doc(`films/${id}/state/claude`).set({ state: 'working', at: new Date().toISOString(), message: 'Applying 1 note' })
  }, film); await sleep(500)
  await shot(page, 'claude-working')
  await page.evaluate(async id => {
    const db = await window.claude.use('db')
    const key = [...window.__mockdb.keys()].find(k => k.startsWith(`films/${id}/notes/`))
    await db.doc(key).update({ claude: { state: 'done', at: new Date().toISOString(), msg: 'Headline 8 % smaller.' }, status: 'done', replies: [{ by: 'claude', text: 'Done: the headline is 8 % smaller; nothing else changed.', at: new Date().toISOString() }] })
    await db.doc(`films/${id}/state/claude`).set({ state: 'idle', at: new Date().toISOString(), message: 'Applied 1 note and published v0.6' })
    await db.collection(`films/${id}/activity`).add({ at: new Date().toISOString(), by: 'claude', kind: 'applied', text: 'Applied note 1 and published v0.6' })
  }, film); await sleep(600)
  await shot(page, 'claude-done')
  await page.click('[data-testid=activity-tab]'); await sleep(300); await shot(page, 'claude-activity')
  await ctx.close()
}

/* Light theme, home, phone */
{
  const { ctx, page } = await open({ theme: 'light' })
  await seek(page, 3.4); await page.locator('[data-tab=choices]').click(); await shot(page, 'watch-light')
  await page.keyboard.press('3'); await page.waitForSelector('[data-testid=plan]'); await sleep(400); await shot(page, 'plan-light')
  await page.click('[aria-label="Previs Studio: all films"]'); await page.waitForSelector('[data-testid=home]'); await sleep(700); await shot(page, 'home-light')
  await ctx.close()
}
{
  const { ctx, page } = await open({ w: 390, h: 844 })
  await seek(page, 3.4); await shot(page, 'phone-watch')
  await page.click('[data-testid=views] [data-view=board]'); await sleep(500); await shot(page, 'phone-storyboard')
  await ctx.close()
}

await browser.close(); server.close()
console.log(`${done.length} screenshots in ${out}: ${done.join(', ')}`)
