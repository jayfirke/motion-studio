// Turns an asciicast v2 recording (a real terminal session, e.g. Claude Code's CLI) into a sharp H.264 video:
// the exact bytes are replayed into xterm.js in headless Chrome and filmed with the screencast, like record-demo.mjs.
//   node scripts/cast-to-video.mjs <in.cast> --out <out.mp4> [--max-gap 2] [--font 18] [--dpr 2] [--redact <regex>]
// --redact hides every screen row whose text, with all spaces removed, matches (case-insensitive; write the regex without spaces), before it is painted: start-up notices from
// personal plugins, plan or usage lines. The row stays blank, so the layout doesn't move.
// Quiet stretches longer than --max-gap seconds are shortened; <out>.timing.json maps film time back to cast time.
import { chromium } from 'playwright-core'
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d }
const inFile = resolve(process.argv[2]), out = resolve(arg('--out', 'cast.mp4'))
const MAXGAP = +arg('--max-gap', 2), FONT = +arg('--font', 18), DPR = +arg('--dpr', 2), REDACT = arg('--redact', '')
const lines = (await readFile(inFile, 'utf8')).trim().split('\n')
const head = JSON.parse(lines[0])
const ev = lines.slice(1).map(l => JSON.parse(l)).filter(e => e[1] === 'o')
// compress long quiet stretches
let shift = 0, prev = 0; const timing = []
for (const e of ev) { const gap = e[0] - prev; if (gap > MAXGAP) shift += gap - MAXGAP; prev = e[0]; timing.push([+(e[0] - shift).toFixed(3), e[0]]); e[0] = +(e[0] - shift).toFixed(3) }
const total = (ev.at(-1)?.[0] || 0) + 1.5
const cellW = FONT * 0.6, cellH = Math.round(FONT * 1.25)
const W = Math.round(head.width * cellW + 48), H = Math.round(head.height * cellH + 48)

const CHROME = [join(homedir(), 'Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => existsSync(p))
const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR })
const page = await ctx.newPage()
await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap">
<style>html,body{margin:0;background:#0d0e11}#t{position:absolute;left:24px;top:24px}</style></head>
<body><div id="t"></div><script src="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.js"></script></body></html>`)
await page.waitForFunction(() => window.Terminal)
await page.evaluate(() => document.fonts.load('18px "JetBrains Mono"'))
await page.evaluate(({ cols, rows, font, redact }) => {
  const term = new window.Terminal({ cols, rows, fontSize: font, fontFamily: '"JetBrains Mono", Menlo, monospace', lineHeight: 1.0, cursorBlink: false,
    allowProposedApi: true, theme: { background: '#0d0e11', foreground: '#e6e6e6' } })
  term.open(document.getElementById('t')); window.__term = term
  if (redact) {
    const rx = new RegExp(redact, 'i'), rows = document.querySelector('.xterm-rows')
    const apply = () => { for (const r of rows.children) r.style.visibility = rx.test((r.textContent || '').replace(/\s+/g, '')) ? 'hidden' : '' }
    new MutationObserver(apply).observe(rows, { childList: true, subtree: true, characterData: true }); apply()
  }
}, { cols: head.width, rows: head.height, font: FONT, redact: REDACT })
await new Promise(r => setTimeout(r, 600))

const tmp = join(tmpdir(), `cast-${Date.now()}`); await mkdir(tmp, { recursive: true })
const cdp = await ctx.newCDPSession(page); const frames = []
cdp.on('Page.screencastFrame', async f => {
  const file = join(tmp, `f${String(frames.length).padStart(6, '0')}.jpg`); frames.push({ file, t: f.metadata.timestamp })
  writeFile(file, Buffer.from(f.data, 'base64')).catch(() => {}); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
})
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W * DPR, maxHeight: H * DPR, everyNthFrame: 1 })
const t0 = Date.now() / 1000
// replay in real time (after gap compression)
for (const [t, , data] of ev) {
  const wait = t0 + t - Date.now() / 1000; if (wait > 0) await new Promise(r => setTimeout(r, wait * 1000))
  await page.evaluate(d => new Promise(res => window.__term.write(d, res)), data)
}
await new Promise(r => setTimeout(r, 1500))
const t1 = Date.now() / 1000
await cdp.send('Page.stopScreencast'); await new Promise(r => setTimeout(r, 300)); await browser.close()
let list = ''
frames.forEach((f, i) => { const nx = i + 1 < frames.length ? frames[i + 1].t : t1; list += `file '${f.file}'\nduration ${Math.max(0.001, nx - f.t).toFixed(4)}\n` })
if (frames.length) list += `file '${frames.at(-1).file}'\n`
await writeFile(join(tmp, 'list.txt'), list)
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'),
  '-vf', `fps=30,scale=${Math.round(W * DPR / 2) * 2}:${Math.round(H * DPR / 2) * 2}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-g', '15', '-movflags', '+faststart', out])
await writeFile(out.replace(/\.mp4$/, '.timing.json'), JSON.stringify({ duration: +(t1 - t0).toFixed(2), maxGap: MAXGAP, map: timing.filter((_, i) => i % 20 === 0) }))
await rm(tmp, { recursive: true, force: true })
console.log(`${out}: ${(t1 - t0).toFixed(1)} s (cast ${ev.length} chunks, ${W * DPR}×${H * DPR})`)
