import type { Option } from '../data/types'

// Plain-words search over an option library: "simple and sober" finds the calm piano and the slate look.
// Works offline, instantly, with no AI; the AI director adds judgement on top when it is available.

const SYN: Record<string, string[]> = {
  sober: ['calm', 'minimal', 'simple', 'quiet', 'soft', 'restrained', 'muted', 'corporate', 'clean', 'serious'],
  simple: ['minimal', 'calm', 'clean', 'sober', 'plain'],
  calm: ['soft', 'gentle', 'quiet', 'relaxed', 'sober', 'slow', 'chill'],
  quiet: ['calm', 'soft', 'minimal'],
  premium: ['elegant', 'polished', 'luxury', 'editorial', 'sober', 'minimal'],
  elegant: ['premium', 'editorial', 'polished'],
  happy: ['playful', 'bright', 'sunny', 'cheerful', 'fun', 'upbeat', 'friendly'],
  fun: ['playful', 'happy', 'bouncy', 'funky', 'cheerful'],
  energetic: ['upbeat', 'high energy', 'dance', 'party', 'fast', 'bold', 'loud'],
  upbeat: ['energetic', 'happy', 'groovy', 'bright'],
  loud: ['bold', 'energetic', 'bright'],
  warm: ['cozy', 'acoustic', 'orange', 'friendly', 'organic'],
  cozy: ['warm', 'lofi', 'soft'],
  chill: ['lofi', 'relaxed', 'calm'],
  modern: ['clean', 'minimal', 'fresh'],
  serious: ['trust', 'sober', 'deep', 'professional'],
  trust: ['blue', 'serious', 'professional', 'finance', 'calm'],
  dark: ['night', 'deep'],
  light: ['bright', 'fresh', 'white'],
  cinematic: ['dramatic', 'emotional', 'slow'],
  dramatic: ['cinematic', 'emotional'],
  female: ['female', 'woman', 'girl'],
  male: ['male', 'man'],
  woman: ['female'],
  man: ['male'],
  indian: ['indian', 'hindi'],
  hindi: ['hi', 'hindi'],
  english: ['en'],
  british: ['british', 'uk'],
  colour: ['bright', 'bold'],
  color: ['bright', 'bold'],
  fast: ['snappy', 'quick', 'brisk', 'punchy'],
  slow: ['calm', 'relaxed', 'slow', 'cinematic'],
  bouncy: ['spring', 'playful', 'pop'],
  smooth: ['smooth', 'soft', 'gentle'],
}
const STOP = new Set('a an the and or but with some more me give show i want need like please for of to in on my it its this that is are be very really bit little too so can could would you your something feel feeling feels look looking option options music colour color colours colors voice voices motion animation make use switch change set go prefer one ones'.split(' '))

export const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').split(/\s+/).filter(w => w && !STOP.has(w))

/** Scores each option against a plain-words wish. Higher is better; 0 means no overlap. */
export function rank(wish: string, items: Option[]): { o: Option; score: number; hits: string[] }[] {
  const ws = words(wish)
  if (!ws.length) return items.map(o => ({ o, score: 0, hits: [] }))
  return items.map(o => {
    const hay = [o.name, o.why, o.pitch, o.intro, o.accent, o.gender, o.lang, o.level, ...(o.tags || [])].filter(Boolean).join(' ').toLowerCase()
    let score = 0; const hits: string[] = []
    ws.forEach(w => {
      if (hay.includes(w)) { score += 3; hits.push(w) }
      ;(SYN[w] || []).forEach(s => { if (hay.includes(s)) { score += 1; if (!hits.includes(s)) hits.push(s) } })
    })
    if ((o.tags || []).some(t => ws.includes(t))) score += 2
    return { o, score, hits }
  }).sort((a, b) => b.score - a.score)
}
