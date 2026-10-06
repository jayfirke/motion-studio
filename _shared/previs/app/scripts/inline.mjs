// Turns the Vite build into one self-contained page body for the Artifact publisher:
// title + fonts + inline CSS + #root + inline module script. No doctype/html/head/body (the publisher adds them).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const app = resolve(here, '..')
const dist = resolve(app, 'dist')
const html = readFileSync(resolve(dist, 'index.html'), 'utf8')
const js = html.match(/<script[^>]+src="\.?\/?([^"]+\.js)"/)?.[1]
const css = html.match(/<link[^>]+href="\.?\/?([^"]+\.css)"/)?.[1]
if (!js || !css) throw new Error('build output not found in dist/index.html')
const code = readFileSync(resolve(dist, js), 'utf8').replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--')
const style = readFileSync(resolve(dist, css), 'utf8').replace(/<\/style/gi, '<\\/style')
const fonts = 'https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'

// The charset line keeps the page working when it is served without the publisher's skeleton (python -m http.server).
const page = title => `<meta charset="utf-8">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>${style}</style>
<div id="root"></div>
<script type="module">${code}</script>
`

// Every page shares the same app; only the title and the data next to it differ.
const root = resolve(app, '../../..')
// Per-film pages are written only where that film's folder exists (a template copy may have none).
const targets = [
  [resolve(app, '../studio/index.html'), 'Previs Studio', true],
  [resolve(app, '../page/index.html'), 'Previs Studio', true],
  [resolve(root, 'projects/011-crumb-previs/previs/page/index.html'), 'Crumb Previs', false],
  [resolve(root, 'projects/012-motion-studio-launch/previs/page/index.html'), 'motion-studio Launch Previs', false],
]
for (const [file, title, always] of targets) {
  if (!always && !existsSync(dirname(file))) continue
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, page(title))
  console.log(`wrote ${file.replace(root + '/', '')} (${(page(title).length / 1024).toFixed(0)} KB)`)
}
