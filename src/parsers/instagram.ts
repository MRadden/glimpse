import type { ParsedExport, Signal } from '../types'
import { classify, classifyHandle } from '../lib/topics'
import { baseName, emptyExport, fixMojibake, safeJson, toTime, walk, type ExportFile } from './util'

export function instagramCode(url: string): { kind: 'p' | 'reel'; code: string } | undefined {
  const m = url.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/)
  if (!m) return undefined
  return { kind: m[1] === 'p' || m[1] === 'tv' ? 'p' : 'reel', code: m[2] }
}

const LINK_FILES: Record<string, Signal> = {
  'liked_posts.json': 'liked',
  'saved_posts.json': 'saved',
  'saved_collections.json': 'saved',
  'posts_viewed.json': 'watched',
  'videos_watched.json': 'watched',
  'reels_watched.json': 'watched',
  'suggested_profiles_viewed.json': 'watched',
}

/** Topics that Instagram picked for your feed. We keep their names even when our dictionary does not know them. */
const CONTENT_TOPIC_FILE = /(your_topics|recommended_topics|topics_you|content_preferences)/i
/** Advertising categories. Many are not about content, so we keep only the ones our dictionary knows. */
const AD_TOPIC_FILE = /(ads_interests|ad_interests|other_categories_used_to_reach_you|inferred|interest_categories|ad_preferences)/i

const SKIP_VALUE = /^(https?:|www\.|\d+$)|@/i
const NAME_LABELS = /^(username|owner|author|name|account|profile)$/i

/** Every short text value in a JSON value: "value", "name" or "title" fields at any depth. */
function textValues(data: unknown): string[] {
  const out: string[] = []
  walk(data, (obj) => {
    for (const key of ['value', 'name', 'title']) {
      const v = obj[key]
      if (typeof v !== 'string') continue
      const s = fixMojibake(v).trim()
      if (s.length >= 2 && s.length <= 60 && !SKIP_VALUE.test(s) && /\p{L}/u.test(s)) out.push(s)
    }
  })
  return out
}

/** A creator's name from the many shapes Instagram uses. */
function authorOf(obj: Record<string, unknown>): string {
  if (typeof obj.title === 'string' && obj.title.trim()) return fixMojibake(obj.title).trim()
  const byLabel: Record<string, string> = {}
  walk(obj, (o) => {
    const label = typeof o.label === 'string' ? o.label.toLowerCase() : ''
    if (NAME_LABELS.test(label) && typeof o.value === 'string' && o.value.trim()) byLabel[label] ??= o.value.trim()
    const sm = o.string_map_data as Record<string, { value?: string }> | undefined
    if (sm) for (const [k, v] of Object.entries(sm)) if (NAME_LABELS.test(k) && v?.value) byLabel[k.toLowerCase()] ??= v.value.trim()
  })
  // The handle is the best name. A display name is the last choice.
  const found = byLabel.username || byLabel.author || byLabel.owner || byLabel.account || byLabel.profile || byLabel.name || ''
  return fixMojibake(found)
}

/** All post links in an object, with their time. */
function linksOf(obj: Record<string, unknown>): { href: string; timestamp?: number }[] {
  const links: { href: string; timestamp?: number }[] = []
  const own = typeof obj.timestamp === 'number' ? obj.timestamp : undefined
  walk(obj, (o) => {
    for (const key of ['href', 'value']) {
      const v = o[key]
      if (typeof v === 'string' && /instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\//.test(v)) {
        links.push({ href: v, timestamp: typeof o.timestamp === 'number' && o.timestamp > 0 ? o.timestamp : own })
      }
    }
  })
  return links
}

function viewTime(obj: Record<string, unknown>): number | undefined {
  const sm = obj.string_map_data as Record<string, { timestamp?: number; value?: string }> | undefined
  return toTime(sm?.Time?.timestamp ?? (typeof obj.timestamp === 'number' ? obj.timestamp : undefined))
}

/** The objects that stand for one post (the items of the main list in each file). */
function entries(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data.filter((x) => x && typeof x === 'object')
  if (data && typeof data === 'object') {
    const lists = Object.values(data).filter(Array.isArray) as unknown[][]
    return lists.flat().filter((x) => x && typeof x === 'object') as Record<string, unknown>[]
  }
  return []
}

/**
 * Instagram "Download your information" (JSON format). We read liked, saved,
 * viewed and watched posts, plus the topics Instagram thinks you like.
 */
export function parseInstagram(files: ExportFile[]): ParsedExport {
  const out = emptyExport('instagram')
  const seen = new Set<string>()

  for (const f of files) {
    if (!f.name.toLowerCase().endsWith('.json')) continue
    const name = baseName(f.name)
    const signal = LINK_FILES[name]
    const content = !signal && CONTENT_TOPIC_FILE.test(name)
    const ads = !signal && !content && AD_TOPIC_FILE.test(name)
    if (!signal && !content && !ads) continue
    const data = safeJson(f.text)
    if (!data) continue
    out.files.push(f.name)

    if (content || ads) {
      for (const text of new Set(textValues(data))) {
        if (/^(name|value|topic|interest)s?$/i.test(text)) continue
        const known = classify(text)
        if (known.length) out.platformTopics.push(...known)
        else if (content) out.platformTopics.push(titleCase(text))
      }
      continue
    }

    for (const obj of entries(data)) {
      const author = authorOf(obj)
      const links = linksOf(obj)
      if (!links.length) {
        if (author) out.creatorViews.push({ name: author, time: viewTime(obj) })
        continue
      }
      for (const l of links) {
        const c = instagramCode(l.href)
        if (!c) continue
        const key = `${signal}:${c.code}`
        if (seen.has(key)) continue
        seen.add(key)
        out.items.push({
          id: `ig-${c.code}`,
          platform: 'instagram',
          url: `https://www.instagram.com/${c.kind}/${c.code}/`,
          embedUrl: `https://www.instagram.com/${c.kind}/${c.code}/embed/`,
          creator: author || undefined,
          time: toTime(l.timestamp) ?? viewTime(obj),
          signal,
          topics: classifyHandle(author),
        })
      }
    }
  }
  return out
}

function titleCase(s: string): string {
  return s.replace(/\s+/g, ' ').replace(/(^|\s)(\p{Ll})/gu, (_, sp, c) => sp + c.toUpperCase())
}
