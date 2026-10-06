// Smoke test for the built Previs Studio page: real Chrome, real clicks, at desktop, tablet, phone and full screen.
// Usage: npm run smoke [-- --out <dir>]   (screenshots land in <dir>, default ./smoke-out)
import { chromium } from 'playwright-core'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../../studio')
const outArg = process.argv.indexOf('--out')
const out = resolve(outArg > 0 ? process.argv[outArg + 1] : join(here, '../smoke-out'))
await mkdir(out, { recursive: true })

const CHROME = [
  join(homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find(p => existsSync(p))
if (!CHROME) throw new Error('No Chrome found for the smoke test')

const TYPES = { '.html': 'text/html; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.js': 'text/javascript', '.css': 'text/css' }
// The page is published without a document skeleton; wrap it the way the publisher does.
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
const url = `http://127.0.0.1:${server.address().port}/`

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
const results = []
const ok = (name, cond, info = '') => { results.push({ name, pass: !!cond, info }); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${info ? `  (${info})` : ''}`) }
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function open(viewport, { tour = false } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: viewport.width < 640 })
  if (!tour) await ctx.addInitScript(() => { try { localStorage.setItem('studio2:toured', 'true') } catch {} })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()) })
  page.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errors.push(`${r.status()} ${r.url()}`) })
  await page.goto(url)
  await page.waitForSelector('[data-testid=frame]', { timeout: 15000 })
  await sleep(600)
  return { ctx, page, errors }
}
const shot = (page, name) => page.screenshot({ path: join(out, `${name}.png`) })
const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)
const timeText = page => page.locator('[data-testid=controls] .mono').first().textContent()
const secs = s => { const m = s.match(/(\d+):(\d+\.\d)/); return m ? +m[1] * 60 + +m[2] : -1 }

/* ---------------- desktop ---------------- */
{
  const { ctx, page, errors } = await open({ width: 1440, height: 900 })
  await shot(page, '01-desktop-watch')
  ok('desktop: no horizontal overflow', await noOverflow(page))
  ok('desktop: side panel docked', await page.locator('[data-testid=side]').isVisible())

  await page.click('[data-testid=play]')
  await sleep(1300)
  const t = secs(await timeText(page))
  ok('play advances the clock', t > 0.8, `t=${t}`)
  const snd = await page.evaluate(() => ({ n: window.__previs.audio.scheduled, st: window.__previs.audio.state }))
  ok('sound is scheduled while playing', snd.n > 0 && snd.st === 'running', `${snd.n} sources, ${snd.st}`)
  await page.keyboard.press('Space')

  // Comment on a small part: the receipt total.
  await page.keyboard.press('Home'); await page.keyboard.press('l'); for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight')
  await sleep(200)
  await page.keyboard.press('c')
  const tb = await page.evaluate(() => {
    const scene = [...document.querySelectorAll('[data-testid=frame] .fscene')].find(w => w.style.visibility === 'visible')
    const el = scene && [...scene.querySelectorAll('*')].find(e => e.children.length === 0 && /186/.test(e.textContent || ''))
    if (!el) return null
    const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }
  })
  ok('price is on screen at the key frame', !!tb)
  if (tb) {
    await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2)
    await sleep(150)
    const label = await page.locator('[data-testid=hover-label]').textContent().catch(() => '')
    ok('hover names the smallest part', !!label && label.length > 2, label)
    await shot(page, '02-comment-hover')
    await page.mouse.wheel(0, 120); await sleep(100)
    const bigger = await page.locator('[data-testid=hover-label]').textContent().catch(() => '')
    ok('scroll picks a bigger part', bigger !== label, bigger)
    await page.mouse.wheel(0, -120)
    await page.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2)
    await page.waitForSelector('[data-testid=composer]')
    await page.keyboard.type('Make the total land bigger.')
    await shot(page, '03-composer')
    await page.keyboard.press('Enter'); await sleep(300)
    ok('note saved', (await page.locator('[data-tab=notes]').textContent()).includes('1'))
  }

  // Drag a box around several parts.
  const fr = await page.locator('[data-testid=frame]').boundingBox()
  await page.mouse.move(fr.x + fr.width * 0.2, fr.y + fr.height * 0.36)
  await page.mouse.down(); await page.mouse.move(fr.x + fr.width * 0.5, fr.y + fr.height * 0.45, { steps: 6 }); await page.mouse.move(fr.x + fr.width * 0.8, fr.y + fr.height * 0.55, { steps: 6 }); await page.mouse.up()
  await page.waitForSelector('[data-testid=composer]')
  const composerText = await page.locator('[data-testid=composer]').textContent()
  ok('drag box selects several parts', /parts/.test(composerText), composerText.slice(0, 90))
  await shot(page, '04-region')
  await page.keyboard.press('Escape')

  // Drag across the shots row: a range note.
  const row = await page.locator('[data-testid=timeline] [role=slider]').boundingBox()
  await page.mouse.move(row.x + row.width * 0.2, row.y + row.height / 2); await page.mouse.down(); await page.mouse.move(row.x + row.width * 0.4, row.y + row.height / 2, { steps: 8 }); await page.mouse.up()
  await sleep(200)
  ok('drag on the timeline opens a range note', await page.locator('[data-testid=composer]').isVisible())
  await shot(page, '05-range')
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape')

  // Pick another look: the frame repaints and plays.
  ok('first visit opens the guided review', await page.locator('[data-testid=start-steps]').isVisible())
  await page.locator('[data-tab=choices]').click()
  await page.getByRole('button', { name: 'Film', exact: true }).click()
  const bg0 = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid=frame] .fstage')).getPropertyValue('--bg'))
  await page.locator('[data-choice=direction] [data-option=C]').click(); await sleep(500)
  const bg1 = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid=frame] .fstage')).getPropertyValue('--bg'))
  ok('picking a look repaints the frame', bg0 !== bg1, `${bg0} -> ${bg1}`)
  ok('picking plays the moment', await page.evaluate(() => document.querySelector('[data-testid=play]').getAttribute('aria-label') === 'Pause'))
  await shot(page, '06-pick-look')
  await page.keyboard.press('Space')

  // Compare two options side by side.
  await page.locator('[data-choice=direction]').getByRole('button', { name: 'Compare' }).click(); await sleep(400)
  ok('compare shows the compare bar', await page.locator('[data-testid=compare-bar]').isVisible())
  await shot(page, '07-compare')
  await page.keyboard.press('Escape')

  // A voice line in the lanes opens its own card.
  await page.locator('[data-lane=vo]').nth(1).click(); await sleep(300)
  ok('voice lane opens its options', await page.locator('[data-choice$=".vo"]').first().isVisible())
  await shot(page, '08-lane-popover')
  await page.keyboard.press('Escape')

  // Drag a sound effect: it moves and snaps to the beat.
  const mark = page.locator('[data-lane=sfx]').nth(3)
  const mb = await mark.boundingBox()
  await page.mouse.move(mb.x + 3, mb.y + mb.height / 2); await page.mouse.down(); await page.mouse.move(mb.x + 40, mb.y + mb.height / 2, { steps: 8 }); await page.mouse.up(); await sleep(300)
  const dt = await page.evaluate(() => { try { const st = JSON.parse(localStorage.getItem('studio2:011-crumb:state')); return Object.values(st.tweaks).map(t => t.dt).filter(Boolean) } catch { return [] } })
  ok('dragging a sound moves it', dt.length > 0, JSON.stringify(dt))
  await page.keyboard.press('Space')

  // Guided review.
  await page.locator('[data-tab=steps]').click(); await page.click('[data-testid=start-steps]'); await page.click('[data-testid=next-step]'); await sleep(300)
  await shot(page, '09-guide')

  // Storyboard: a shot plays inside its card.
  await page.keyboard.press('2'); await page.waitForSelector('[data-testid=board]')
  await page.click('[data-testid=play-shot-2]'); await sleep(1200)
  const prog = await page.locator('[data-shot=s2] .bg-ember').first().evaluate(e => parseFloat(e.style.width))
  ok('storyboard shot plays in place', prog > 5, `${prog.toFixed(0)}%`)
  ok('still in the storyboard while it plays', await page.locator('[data-testid=board]').isVisible())
  await shot(page, '10-storyboard')

  await page.click('[data-testid=play-all]'); await sleep(3600)
  ok('play all moves on to the next shot', await page.locator('[data-shot=s2].ring-1').count() > 0 || await page.locator('[data-shot=s2] .bg-ember').first().evaluate(e => parseFloat(e.style.width) > 0))
  await page.keyboard.press('3'); await page.waitForSelector('[data-testid=plan]'); await sleep(300)
  await shot(page, '11-plan')

  // Full screen (theater fallback in headless).
  await page.keyboard.press('1'); await page.waitForSelector('[data-testid=frame]'); await page.keyboard.press('f'); await sleep(500)
  const pr = await page.locator('[data-testid=player]').boundingBox()
  ok('full screen fills the window', pr.width >= 1430 && pr.height >= 890, `${pr.width}x${pr.height}`)
  await shot(page, '12-fullscreen')
  await page.keyboard.press('Escape'); await sleep(200)

  await page.keyboard.press('Meta+k'); await sleep(200); await page.keyboard.type('music')
  await shot(page, '13-palette'); await page.keyboard.press('Escape')
  await page.click('[data-testid=approve]'); await sleep(250)
  await shot(page, '14-approve')
  await page.click('[data-testid=confirm-approve]'); await sleep(300)
  ok('approval saved', (await page.locator('[data-testid=approve]').textContent()).includes('Approved'))
  ok('desktop: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await ctx.close()
}

/* ---------------- v3: libraries, ask, compare, captions, voice, theme, storyboard, plan ---------------- */
{
  const { ctx, page, errors } = await open({ width: 1440, height: 900 })
  await page.locator('[data-tab=choices]').click()
  await page.getByRole('button', { name: 'Film', exact: true }).click()
  // More options: add a library look and use it.
  const bg0 = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid=frame] .fstage')).getPropertyValue('--bg'))
  await page.click('[data-testid="more-direction"]'); await page.waitForSelector('[data-testid=library]')
  await page.fill('[aria-label="Describe what you want"]', 'simple and sober')
  ok('library filters by plain words', (await page.locator('[data-lib]').count()) >= 2, `${await page.locator('[data-lib]').count()} matches`)
  await shot(page, '24-library')
  await page.locator('[data-testid=lib-use]').first().click(); await sleep(400)
  const bg1 = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid=frame] .fstage')).getPropertyValue('--bg'))
  ok('a library look can be added and used', bg0 !== bg1, `${bg0} -> ${bg1}`)
  await page.keyboard.press('Escape'); await sleep(200)
  ok('the added look is option D on the card', await page.locator('[data-choice=direction] [data-option=D]').count() === 1)
  // Motion compare shows three versions on a loop.
  await page.locator('[data-choice=motion]').getByRole('button', { name: 'Compare' }).click(); await sleep(900)
  ok('motion compare shows three versions', await page.locator('[data-testid=compare-tile]').count() === 3)
  ok('motion compare loops the moment', await page.evaluate(() => document.querySelector('[data-testid=play]').getAttribute('aria-label') === 'Pause'))
  await shot(page, '25-compare-motion')
  await page.getByRole('button', { name: 'Done' }).click(); await sleep(200)
  // Ask works without AI.
  await page.locator('[data-tab=ask]').click()
  await page.fill('textarea[aria-label="Ask the director"]', 'I want music that is simple and sober'); await page.keyboard.press('Enter'); await sleep(700)
  const askText = await page.locator('[data-testid=ask]').textContent()
  ok('Ask adds music for "simple and sober" (offline)', /Calming piano/.test(askText), askText.slice(-120))
  await page.fill('textarea[aria-label="Ask the director"]', 'Which voices and languages do you have?'); await page.keyboard.press('Enter'); await sleep(600)
  ok('Ask lists voices and languages', /Hindi/.test(await page.locator('[data-testid=ask]').textContent()))
  await shot(page, '26-ask')
  // Voice: switch to Hindi, captions show the Hindi line.
  await page.locator('[data-tab=choices]').click(); await page.getByRole('button', { name: 'Film', exact: true }).click()
  await page.locator('[data-choice=voice] [data-option=C]').click(); await sleep(300)
  await page.keyboard.press('Space'); await page.keyboard.press('Home'); for (let i = 0; i < 25; i++) await page.keyboard.press('ArrowRight')
  await page.keyboard.press('s'); await sleep(300)
  const cap = await page.locator('[data-testid=caption]').textContent().catch(() => '')
  ok('captions show the Hindi line', /[\u0900-\u097F]/.test(cap), cap)
  await shot(page, '27-captions-hindi')
  await page.keyboard.press('s')
  // Light theme.
  await page.click('[data-testid=settings]'); await page.click('[data-testid=theme-light]'); await sleep(300)
  ok('light theme applies', await page.evaluate(() => document.documentElement.dataset.studioTheme === 'light'))
  await shot(page, '28-light')
  // Storyboard layouts and the shot sheet.
  await page.keyboard.press('2'); await page.waitForSelector('[data-testid=board]')
  await page.click('[data-testid=sheet-2]'); await page.waitForSelector('[data-testid=shot-sheet]'); await sleep(400)
  await shot(page, '29-shot-sheet')
  await page.getByRole('tab', { name: 'Sound' }).click(); await sleep(200)
  ok('shot sheet lists the narration', /Narration/.test(await page.locator('[data-testid=sheet-body]').textContent()))
  await page.keyboard.press('Escape'); await sleep(200)
  await page.click('[data-layout=strip]'); await sleep(400); ok('film strip layout', await page.locator('[data-testid=strip]').isVisible()); await shot(page, '30-strip')
  await page.click('[data-layout=script]'); await sleep(400); ok('script layout', await page.locator('[data-testid=script]').isVisible()); await shot(page, '31-script')
  // Plan: sections and the spec export.
  await page.keyboard.press('3'); await page.waitForSelector('[data-testid=plan]')
  ok('plan has 19 sections', (await page.locator('[data-section]').count()) === 19, `${await page.locator('[data-section]').count()}`)
  await page.click('[data-section=export]'); await sleep(500)
  ok('spec export lists every shot', /"shots"/.test(await page.locator('[data-testid=spec]').textContent()))
  await shot(page, '32-plan-light')
  ok('v3: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await ctx.close()
}

/* ---------------- artifact runtime (mocked db + sample) ---------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(() => {
    try { localStorage.setItem('studio2:toured', 'true') } catch {}
    // A tiny in-memory stand-in for the artifact runtime: db with live snapshots, user, and sample with tools.
    const docs = new Map(), subs = new Set()
    const snap = (id, data) => ({ id, exists: data !== undefined, data: () => data })
    const fire = () => subs.forEach(f => f())
    const kids = path => [...docs.entries()].filter(([k]) => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/'))
    const docRef = path => ({
      get: async () => snap(path.split('/').pop(), docs.get(path)),
      set: async d => { docs.set(path, JSON.parse(JSON.stringify(d))); fire() },
      update: async d => { docs.set(path, { ...(docs.get(path) || {}), ...JSON.parse(JSON.stringify(d)) }); fire() },
      delete: async () => { docs.delete(path); fire() },
      onSnapshot: (n) => { const f = () => n(snap(path.split('/').pop(), docs.get(path))); subs.add(f); f(); return () => subs.delete(f) },
    })
    let seq = 0
    const db = {
      doc: docRef,
      collection: path => ({
        doc: id => docRef(`${path}/${id || 'd' + ++seq}`),
        add: async d => { const id = 'n' + ++seq; docs.set(`${path}/${id}`, JSON.parse(JSON.stringify(d))); fire(); return docRef(`${path}/${id}`) },
        onSnapshot: (n) => { const f = () => n({ docs: kids(path).map(([k, v]) => snap(k.split('/').pop(), v)) }); subs.add(f); f(); return () => subs.delete(f) },
      }),
    }
    const sample = async (input, opts = {}) => {
      const last = input[input.length - 1].content
      let text = 'The bells drop right as the total lands, which makes the first beat feel like a reveal.'
      if (/music.*b|tropicorp/i.test(last) && opts.tools) { await opts.tools[0].execute({ key: 'music', option: 'B' }); text = 'Done: I switched the music to Tropicorp and played the opening.' }
      await new Promise(r => setTimeout(r, 120)); opts.onText?.({ text, delta: text })
      return { text }
    }
    sample.limits = async () => ({ tools: { maxTools: 8 } })
    sample.json = async (input, opts = {}) => { const q = input[input.length - 1].content; await new Promise(r => setTimeout(r, 120)); opts.onText?.({ text: '{"reply": "Done', delta: '' }); return /music.*b|tropicorp/i.test(q) ? { reply: 'Done: I switched the music to Tropicorp and played the opening.', actions: [{ type: 'pick', key: 'music', option: 'B' }] } : { reply: 'Here you go.', actions: [] } }
    window.__mockdb = docs
    const comments = { canSendToClaude: async () => 'available', anchorFor: async () => ({ path: 'x', x: 0, y: 0 }), sendToClaude: async t => { window.__sent = t.text; return { threadId: 't1', commentId: 'c1' } }, openComposer: async () => ({ opened: true }) }
    window.claude = { use: async n => (n === 'db' ? db : n === 'sample' ? sample : n === 'comments' ? comments : n === 'user' ? { id: async () => 'u_test', isOwner: async () => true, can: async () => true } : null) }
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(String(e.stack || e).split('\n').slice(0, 3).join(' ')))
  await page.goto(url); await page.waitForSelector('[data-testid=frame]'); await sleep(800)
  ok('runtime: sync shows saved', /Saved|Connecting/.test(await page.locator('[data-testid=sync]').textContent()))
  await page.locator('[data-tab=choices]').click()
  await page.locator('[data-choice] [data-option=B]').first().click(); await sleep(1000)
  const saved = await page.evaluate(() => JSON.stringify(window.__mockdb.get('films/011-crumb/state/picks') || null))
  ok('runtime: picks save to the page database', saved.includes('"picks"'), saved.slice(0, 60))
  await page.keyboard.press('Space'); await page.keyboard.press('c')
  const fr = await page.locator('[data-testid=frame]').boundingBox()
  await page.mouse.move(fr.x + fr.width / 2, fr.y + fr.height * 0.2); await page.mouse.click(fr.x + fr.width / 2, fr.y + fr.height * 0.2)
  await page.waitForSelector('[data-testid=composer]'); await page.keyboard.type('Headline a touch smaller.'); await page.keyboard.press('Enter'); await sleep(400)
  const notes = await page.evaluate(() => [...window.__mockdb.keys()].filter(k => k.startsWith('films/011-crumb/notes/')).length)
  ok('runtime: a note lands in the page database', notes === 1, `${notes}`)
  ok('runtime: the note shows in the list', (await page.locator('[data-tab=notes]').textContent()).includes('1'))
  await page.keyboard.press('Escape')
  await page.locator('[data-tab=ask]').click(); await sleep(200)
  await page.locator('textarea[aria-label="Ask the director"]').fill('Please switch the music to B, Tropicorp'); await page.keyboard.press('Enter'); await sleep(900)
  const askText = await page.locator('[data-testid=ask]').textContent()
  ok('runtime: Ask the director answers', /switched the music/.test(askText), askText.slice(-90))
  const music = await page.evaluate(() => window.__previs.state().picks.music)
  ok('runtime: the director can switch an option', music === 'B', music)
  await shot(page, '23-ask')
  await page.click('[data-testid=approve]'); await page.click('[data-testid=confirm-approve]'); await sleep(400)
  const appr = await page.evaluate(() => JSON.stringify(window.__mockdb.get('films/011-crumb/state/approval') || null))
  ok('runtime: approval lands in the page database', appr.includes('"approved":true'), appr.slice(0, 70))
  // The Claude Code bridge: send live, see the note marked sent, then Claude's status and replies arrive.
  await page.locator('[data-tab=notes]').click(); await sleep(300)
  await page.click('[data-testid=send-claude]'); await sleep(600)
  ok('runtime: notes are sent to Claude Code live', await page.evaluate(() => /films\/011-crumb\/notes/.test(window.__sent || '')))
  ok('runtime: a sent note shows it is waiting for Claude', /Sent · waiting/.test(await page.locator('[data-testid=claude-state]').first().textContent()))
  await page.evaluate(async () => {
    const db = await window.claude.use('db')
    await db.doc('films/011-crumb/state/claude').set({ state: 'working', at: new Date().toISOString(), message: 'Applying 1 note' })
    const key = [...window.__mockdb.keys()].find(k => k.startsWith('films/011-crumb/notes/'))
    await db.doc(key).update({ claude: { state: 'done', at: new Date().toISOString(), msg: 'Headline is 8 % smaller.' }, status: 'done', replies: [{ by: 'claude', text: 'Done: headline 8 % smaller.', at: new Date().toISOString() }] })
    await db.collection('films/011-crumb/activity').add({ at: new Date().toISOString(), by: 'claude', kind: 'applied', text: 'Applied note 1 and published v0.4' })
  }); await sleep(500)
  ok('runtime: Claude status shows in the card', /Working on your notes/.test(await page.locator('[data-testid=claude-card]').textContent()))
  ok('runtime: a note shows Done by Claude', /Done by Claude/.test(await page.locator('[data-testid=claude-state]').first().textContent()))
  await page.click('[data-testid=activity-tab]'); await sleep(200)
  ok('runtime: activity shows what Claude did', /published v0.4/.test(await page.locator('[data-testid=activity]').textContent()))
  await shot(page, '33-claude-bridge')
  ok('runtime: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await ctx.close()
}

/* ---------------- home ---------------- */
{
  const { ctx, page } = await open({ width: 1280, height: 800 })
  await page.click('[aria-label="Previs Studio: all films"]'); await page.waitForSelector('[data-testid=home]'); await sleep(500)
  ok('home lists the film with a poster', await page.locator('[data-film-card="011-crumb"]').isVisible())
  await shot(page, '22-home')
  await ctx.close()
}

/* ---------------- first run tour ---------------- */
{
  const { ctx, page } = await open({ width: 1280, height: 800 }, { tour: true })
  await sleep(1300)
  ok('tour shows on first visit', await page.getByRole('dialog', { name: 'Quick tour' }).isVisible())
  await shot(page, '15-tour')
  await ctx.close()
}

/* ---------------- tablet ---------------- */
{
  const { ctx, page, errors } = await open({ width: 820, height: 1180 })
  ok('tablet: no horizontal overflow', await noOverflow(page))
  await shot(page, '16-tablet')
  ok('tablet: panel docks beside a portrait film', await page.locator('[data-testid=side]').isVisible())
  await page.keyboard.press('2'); await sleep(500)
  await shot(page, '17-tablet-board')
  ok('tablet: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await ctx.close()
}

/* ---------------- phone ---------------- */
{
  const { ctx, page, errors } = await open({ width: 390, height: 844 })
  ok('phone: no horizontal overflow', await noOverflow(page))
  await shot(page, '18-phone')
  await page.click('[data-testid=panel-toggle]'); await sleep(300)
  await shot(page, '19-phone-sheet')
  await page.keyboard.press('Escape')
  await page.click('[data-testid=views] [data-view=board]'); await sleep(500)
  ok('phone: storyboard has no overflow', await noOverflow(page))
  await shot(page, '20-phone-board')
  // Tap to comment with a finger.
  await page.click('[data-testid=views] [data-view=watch]'); await sleep(400)
  await page.click('[data-testid=comment-toggle]'); await sleep(200)
  const fb = await page.locator('[data-testid=frame]').boundingBox()
  // A finger tap: pointer events of type touch, with no hover before them.
  await page.evaluate(([x, y]) => {
    const layer = document.querySelector('[data-testid=comment-layer]')
    const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerType: 'touch', pointerId: 7, isPrimary: true, button: 0, buttons: 1 }
    layer.dispatchEvent(new PointerEvent('pointerdown', o)); layer.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 }))
  }, [fb.x + fb.width * 0.5, fb.y + fb.height * 0.12]); await sleep(300)
  const target = await page.locator('[data-testid=composer]').textContent().catch(() => '')
  ok('phone: a tap names the part under the finger', !!target && !/This spot/.test(target), target.slice(0, 60))
  await shot(page, '21-phone-composer')
  ok('phone: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
  await ctx.close()
}

await browser.close(); server.close()
const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed. Screenshots: ${out}`)
process.exit(failed.length ? 1 : 0)
