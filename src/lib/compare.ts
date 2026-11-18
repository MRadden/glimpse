import type { InterestScore } from '../types'

export interface CompareRow {
  topic: string
  a: number // share of A's feed, 0..1
  b: number
}

export interface Comparison {
  /** 0..100. How alike the two interest maps are (cosine similarity). */
  score: number
  rows: CompareRow[]
  shared: CompareRow[]
  onlyA: CompareRow[]
  onlyB: CompareRow[]
}

const SHARED_MIN = 0.03
const OWN_MIN = 0.05
const OTHER_MAX = 0.02

export function compareInterests(a: InterestScore[], b: InterestScore[]): Comparison {
  const map = new Map<string, CompareRow>()
  for (const x of a) map.set(x.topic, { topic: x.topic, a: x.share, b: 0 })
  for (const y of b) {
    const row = map.get(y.topic) ?? { topic: y.topic, a: 0, b: 0 }
    row.b = y.share
    map.set(y.topic, row)
  }
  const rows = [...map.values()].sort((x, y) => y.a + y.b - (x.a + x.b))

  const dot = rows.reduce((s, r) => s + r.a * r.b, 0)
  const na = Math.sqrt(rows.reduce((s, r) => s + r.a * r.a, 0))
  const nb = Math.sqrt(rows.reduce((s, r) => s + r.b * r.b, 0))
  const score = na && nb ? Math.round((dot / (na * nb)) * 100) : 0

  return {
    score,
    rows,
    shared: rows.filter((r) => r.a >= SHARED_MIN && r.b >= SHARED_MIN).sort((x, y) => Math.min(y.a, y.b) - Math.min(x.a, x.b)),
    onlyA: rows.filter((r) => r.a >= OWN_MIN && r.b < OTHER_MAX).sort((x, y) => y.a - x.a),
    onlyB: rows.filter((r) => r.b >= OWN_MIN && r.a < OTHER_MAX).sort((x, y) => y.b - x.b),
  }
}
