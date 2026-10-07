// A stand-in for the claude.ai artifact runtime (page database, comments bridge, AI director), for local captures.
// Used by gallery.mjs and record-demo.mjs through page.addInitScript(runtimeStub, arg).
// arg is the film id, or { filmId, seed, askOffline }: seed = { "<path under films/<id>/>": doc } pre-fills the page database
// (comments, notes, activity, Claude's state) so a recording opens on a realistic review; askOffline makes Ask use the
// built-in library director instead of a stubbed AI.
export function runtimeStub(arg) {
    const filmId = typeof arg === 'string' ? arg : arg.filmId
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
    if (arg && arg.seed) for (const [k, v] of Object.entries(arg.seed)) docs.set(`films/${filmId}/${k}`, JSON.parse(JSON.stringify(v)))
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
    // A recording can script the director's next answer: window.__askScript = [{ reply, actions, streamMs, holdMs }].
    // The reply streams in like a live answer, then the actions run (label such a clip: the answer is scripted).
    sample.json = async (input, opts = {}) => {
      const s = (window.__askScript || []).shift()
      if (!s) return { reply: 'Here you go.', actions: [] }
      const words = s.reply.split(' '), n = words.length, step = (s.streamMs || 1600) / n
      // streamed like the raw JSON a live answer sends (AskPanel reads the "reply" field as it grows)
      for (let i = 1; i <= n; i++) { await new Promise(r => setTimeout(r, step)); opts.onText?.({ text: '{"reply": "' + words.slice(0, i).join(' ').replace(/"/g, '\\"'), delta: words[i - 1] }) }
      await new Promise(r => setTimeout(r, s.holdMs || 0))
      return { reply: s.reply, actions: s.actions || [] }
    }
    window.__mockdb = docs
    const comments = { canSendToClaude: async () => 'available', anchorFor: async () => ({ path: 'x', x: 0, y: 0 }), sendToClaude: async t => { window.__sent = t.text; return { threadId: 't1', commentId: 'c1' } }, openComposer: async () => ({ opened: true }) }
    const ask = arg && arg.askOffline ? null : sample
    window.claude = { use: async n => (n === 'db' ? db : n === 'sample' ? ask : n === 'comments' ? comments : n === 'user' ? { id: async () => 'u_demo', isOwner: async () => true, can: async () => true } : null) }
    window.__filmId = filmId
  }
