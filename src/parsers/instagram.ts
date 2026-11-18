import type { ParsedExport, Signal } from '../types'
import { classify } from '../lib/topics'
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
}

const TOPIC_FILE = /(your_topics|recommended_topics|ads_interests|other_categories_used_to_reach_you|inferred_data)/i

/** Read the label/value pairs that Instagram uses in many formats. */
function fieldsOf(obj: Record<string, unknown>): Record<string, { value?: string; href?: string; timestamp?: number }> {
  const out: Record<string, { value?: string; href?: string; timestamp?: number }> = {}
  const sm = obj.string_map_data as Record<string, { value?: string; href?: string; timestamp?: number }> | undefined
  if (sm) Object.assign(out, sm)
  const lv = obj.label_values as { label?: string; value?: string; href?: string; timestamp?: number }[] | undefined
  if (Array.isArray(lv)) for (const e of lv) if (e.label) out[e.label] = e
  return out
}

/**
 * Instagram "Download your information" (JSON format). We read liked, saved,
 * viewed and watched posts, plus the topics Instagram thinks you like.
 */
export function parseInstagram(files: ExportFile[]): ParsedExport {
  const out = emptyExport('instagram')
  const seen = new Set<string>()

  for (const f of files) {
    const name = baseName(f.name)
    const signal = LINK_FILES[name]
    const isTopics = TOPIC_FILE.test(name)
    if (!signal && !isTopics) continue
    const data = safeJson(f.text)
    if (!data) continue
    out.files.push(f.name)

    if (isTopics) {
      walk(data, (obj) => {
        const fields = fieldsOf(obj)
        for (const [label, v] of Object.entries(fields)) {
          if (/name|interest|topic|value/i.test(label) && v.value) {
            const raw = fixMojibake(v.value)
            const topics = classify(raw)
            out.platformTopics.push(...(topics.length ? topics : []))
          }
        }
        const list = (obj as { string_list_data?: { value?: string }[] }).string_list_data
        if (Array.isArray(list)) for (const e of list) if (e.value) out.platformTopics.push(...classify(fixMojibake(e.value)))
      })
      continue
    }

    walk(data, (obj) => {
      const fields = fieldsOf(obj)
      const author = fixMojibake(
        (obj.title as string) || fields.Author?.value || fields.Owner?.value || fields.Username?.value || '',
      ).trim()
      const links: { href: string; timestamp?: number }[] = []
      for (const v of Object.values(fields)) if (v?.href) links.push({ href: v.href, timestamp: v.timestamp })
      const list = (obj as { string_list_data?: { href?: string; timestamp?: number }[] }).string_list_data
      if (Array.isArray(list)) for (const e of list) if (e.href) links.push({ href: e.href, timestamp: e.timestamp })

      const time = toTime(links[0]?.timestamp ?? fields.Time?.timestamp ?? fields.Time?.value)
      if (!links.length) {
        if (author && fields.Author) out.creatorViews.push({ name: author, time })
        return
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
          time: toTime(l.timestamp) ?? time,
          signal,
          topics: classify(author),
        })
      }
    })
  }
  return out
}
