import type { CreatorScore, FeedItem, InterestScore, ParsedExport, Platform, Profile, Signal } from '../types'
import { classify, classifyHandle } from './topics'

const SIGNAL_WEIGHT: Record<Signal, number> = { watched: 1, saved: 2.5, liked: 3 }
const RANK: Record<Signal, number> = { watched: 0, saved: 1, liked: 2 }
const DAY = 86_400_000

/** Recent things count more. Half weight after about 90 days. */
function recency(time: number | undefined, newest: number): number {
  if (!time || !newest) return 0.75
  const age = Math.max(0, newest - time) / DAY
  return 0.4 + 0.6 * Math.exp(-age / 130)
}

export function buildProfile(exports: ParsedExport[]): Profile {
  const byId = new Map<string, FeedItem & { repeats: number }>()
  for (const ex of exports) {
    for (const it of ex.items) {
      const prev = byId.get(it.id)
      if (!prev) {
        byId.set(it.id, { ...it, repeats: 1 })
        continue
      }
      prev.repeats++
      if (RANK[it.signal] > RANK[prev.signal]) prev.signal = it.signal
      prev.time = Math.max(prev.time ?? 0, it.time ?? 0) || undefined
      prev.title ??= it.title
      prev.creator ??= it.creator
      if (!prev.topics.length) prev.topics = it.topics
    }
  }
  const items = [...byId.values()]
  const newest = Math.max(0, ...items.map((i) => i.time ?? 0))

  const scores = new Map<string, number>()
  const bump = (topic: string, w: number) => scores.set(topic, (scores.get(topic) ?? 0) + w)

  for (const it of items) {
    const w = SIGNAL_WEIGHT[it.signal] * recency(it.time, newest) * Math.min(3, 1 + 0.5 * (it.repeats - 1))
    it.topics.forEach((t, i) => bump(t, i === 0 ? w : w * 0.5))
  }
  for (const ex of exports) {
    for (const t of ex.platformTopics) bump(t, 2)
    for (const s of ex.searches) for (const t of classify(s.query)) bump(t, 0.5)
    for (const c of ex.creatorViews) for (const t of classifyHandle(c.name)) bump(t, 0.3)
  }

  const total = [...scores.values()].reduce((a, b) => a + b, 0) || 1
  const interests: InterestScore[] = [...scores.entries()]
    .map(([topic, s]) => ({ topic, share: s / total }))
    .filter((i) => i.share >= 0.015)
    .sort((a, b) => b.share - a.share)
    .slice(0, 12)

  const creatorCount = new Map<string, CreatorScore>()
  const addCreator = (name: string | undefined, platform: Platform, n = 1) => {
    if (!name) return
    const key = `${platform}:${name.toLowerCase()}`
    const c = creatorCount.get(key) ?? { name, platform, count: 0 }
    c.count += n
    creatorCount.set(key, c)
  }
  for (const it of items) addCreator(it.creator, it.platform, it.repeats)
  for (const ex of exports) for (const c of ex.creatorViews) addCreator(c.name, ex.platform)
  const creators = [...creatorCount.values()].sort((a, b) => b.count - a.count).slice(0, 15)

  const searches = exports.flatMap((e) => e.searches).sort((a, b) => (b.time ?? 0) - (a.time ?? 0))

  return {
    items: items
      .map(({ repeats: _r, ...rest }) => rest)
      .sort((a, b) => RANK[b.signal] - RANK[a.signal] || (b.time ?? 0) - (a.time ?? 0)),
    interests,
    creators,
    searches,
    platforms: [...new Set(exports.map((e) => e.platform))],
    stats: {
      watched: items.filter((i) => i.signal === 'watched').length,
      liked: items.filter((i) => i.signal !== 'watched').length,
      searches: searches.length,
    },
  }
}

/** Seeded random, so the same snapshot always gives the same order. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

/**
 * Pick the posts for the shared feed. Liked and saved posts first, then
 * recent watched posts. Mix the platforms and topics so the feed feels real.
 */
export function pickFeed(items: FeedItem[], max = 120, seed = 7): FeedItem[] {
  const playable = items.filter((i) => i.embedUrl || i.demo)
  const strong = playable.filter((i) => i.signal !== 'watched')
  const watched = playable.filter((i) => i.signal === 'watched')
  const chosen = [...strong.slice(0, Math.ceil(max * 0.55))]
  for (const w of watched) {
    if (chosen.length >= max) break
    chosen.push(w)
  }
  for (const s of strong.slice(Math.ceil(max * 0.55))) {
    if (chosen.length >= max) break
    chosen.push(s)
  }
  // Shuffle, then stop two posts of the same topic from sitting side by side when possible.
  const r = rng(seed)
  const pool = chosen.map((v) => ({ v, k: r() })).sort((a, b) => a.k - b.k).map((x) => x.v)
  const out: FeedItem[] = []
  while (pool.length) {
    const last = out[out.length - 1]
    let idx = pool.findIndex((p) => !last || (p.topics[0] ?? '') !== (last.topics[0] ?? '') || p.platform !== last.platform)
    if (idx < 0) idx = 0
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}
