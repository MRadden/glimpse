import type { FeedItem, ParsedExport, Signal } from '../types'
import { classify } from '../lib/topics'
import { emptyExport, findFiles, safeJson, toTime, walk, type ExportFile } from './util'

export function tiktokVideoId(link: string): string | undefined {
  return link.match(/\/video\/(\d{8,})/)?.[1] ?? link.match(/[?&](?:item_id|share_item_id)=(\d{8,})/)?.[1]
}

function signalFor(path: string[]): Signal | undefined {
  const p = path.join(' ').toLowerCase()
  if (/like/.test(p)) return 'liked'
  if (/favou?rite/.test(p)) return 'saved'
  if (/brows|watch/.test(p)) return 'watched'
  return undefined
}

/**
 * TikTok export: user_data_tiktok.json (or user_data.json in older exports).
 * Lists we read: Video Browsing History, Like List, Favorite Videos, Search History.
 */
export function parseTikTok(files: ExportFile[]): ParsedExport {
  const out = emptyExport('tiktok')
  const seen = new Set<string>()
  for (const file of findFiles(files, 'user_data_tiktok.json', 'user_data.json')) {
    const data = safeJson(file.text)
    if (!data) continue
    out.files.push(file.name)
    walk(data, (obj, path) => {
      const link = (obj.Link ?? obj.link ?? obj.VideoLink) as string | undefined
      const date = obj.Date ?? obj.date
      if (typeof link === 'string') {
        const signal = signalFor(path)
        const id = tiktokVideoId(link)
        if (!signal || !id) return
        const key = `${signal}:${id}:${date}`
        if (seen.has(key)) return
        seen.add(key)
        const item: FeedItem = {
          id: `tt-${id}`,
          platform: 'tiktok',
          url: `https://www.tiktok.com/@/video/${id}`,
          embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
          time: toTime(date),
          signal,
          topics: [],
        }
        out.items.push(item)
      }
      const term = obj.SearchTerm ?? obj.searchTerm
      if (typeof term === 'string' && term.trim()) {
        out.searches.push({ platform: 'tiktok', query: term.trim(), time: toTime(date) })
      }
    })
  }
  // TikTok search terms also hint at interests.
  for (const s of out.searches) out.platformTopics.push(...classify(s.query))
  return out
}
