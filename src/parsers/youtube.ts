import type { ParsedExport, Signal } from '../types'
import { classify } from '../lib/topics'
import { baseName, emptyExport, findFiles, safeJson, toTime, type ExportFile } from './util'

export function youtubeVideoId(url: string): string | undefined {
  return url.match(/[?&]v=([\w-]{11})/)?.[1] ?? url.match(/youtu\.be\/([\w-]{11})/)?.[1] ?? url.match(/shorts\/([\w-]{11})/)?.[1]
}

interface TakeoutEntry {
  title?: string
  titleUrl?: string
  subtitles?: { name?: string; url?: string }[]
  time?: string
  details?: { name?: string }[]
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;| /g, ' ')
}

/** Takeout's default format is HTML. We read it with simple patterns. */
function entriesFromHtml(html: string, kind: 'watch' | 'search'): TakeoutEntry[] {
  const out: TakeoutEntry[] = []
  const cells = html.split(/<div class="outer-cell/).slice(1)
  for (const cell of cells) {
    if (/From Google Ads/i.test(cell)) continue
    const links = [...cell.matchAll(/<a href="([^"]+)">([^<]*)<\/a>/g)]
    const date = cell.match(/<br>([A-Z][a-z]{2} \d{1,2}, \d{4},[^<]+)<\/div>/)?.[1]
    const time = date ? toTime(decodeHtml(date).replace(/\s[A-Z]{2,4}$/, '').replace(/ ?([AP]M)/, ' $1')) : undefined
    if (kind === 'watch' && links[0]) {
      out.push({
        title: decodeHtml(links[0][2]),
        titleUrl: decodeHtml(links[0][1]),
        subtitles: links[1] ? [{ name: decodeHtml(links[1][2]), url: links[1][1] }] : [],
        time: time ? new Date(time).toISOString() : undefined,
      })
    } else if (kind === 'search' && links[0]) {
      out.push({ title: 'Searched for ' + decodeHtml(links[0][2]), time: time ? new Date(time).toISOString() : undefined })
    }
  }
  return out
}

function readEntries(file: ExportFile, kind: 'watch' | 'search'): TakeoutEntry[] {
  if (file.name.toLowerCase().endsWith('.html')) return entriesFromHtml(file.text, kind)
  const data = safeJson(file.text)
  return Array.isArray(data) ? (data as TakeoutEntry[]) : []
}

/**
 * Google Takeout for YouTube: watch-history.json/.html, search-history.json/.html,
 * subscriptions.csv. Liked videos are in "Liked videos.csv" (playlists folder).
 */
export function parseYouTube(files: ExportFile[]): ParsedExport {
  const out = emptyExport('youtube')

  const add = (e: TakeoutEntry, signal: Signal) => {
    if (e.details?.some((d) => /ads/i.test(d.name ?? ''))) return // skip ads
    const id = e.titleUrl && youtubeVideoId(e.titleUrl)
    if (!id) return // removed or private video
    const title = (e.title ?? '').replace(/^Watched\s+/, '').trim()
    const creator = e.subtitles?.[0]?.name
    out.items.push({
      id: `yt-${id}`,
      platform: 'youtube',
      url: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&modestbranding=1`,
      title,
      creator,
      time: toTime(e.time),
      signal,
      topics: classify(title, creator),
    })
  }

  for (const f of findFiles(files, 'watch-history.json', 'watch-history.html')) {
    out.files.push(f.name)
    readEntries(f, 'watch').forEach((e) => add(e, 'watched'))
  }

  for (const f of findFiles(files, 'search-history.json', 'search-history.html')) {
    out.files.push(f.name)
    for (const e of readEntries(f, 'search')) {
      if (e.details?.some((d) => /ads/i.test(d.name ?? ''))) continue
      const q = (e.title ?? '').replace(/^Searched for\s+/, '').trim()
      if (q) out.searches.push({ platform: 'youtube', query: q, time: toTime(e.time) })
    }
  }

  // Liked videos: CSV with a Video ID column (name differs by language).
  for (const f of files.filter((f) => /liked videos.*\.csv$/i.test(baseName(f.name)))) {
    out.files.push(f.name)
    const likedIds = new Set(f.text.match(/^\s*([\w-]{11})\s*,/gm)?.map((l) => l.trim().slice(0, 11)) ?? [])
    for (const item of out.items) if (likedIds.has(item.id.slice(3))) item.signal = 'liked'
  }

  for (const f of findFiles(files, 'subscriptions.csv')) {
    out.files.push(f.name)
    const lines = f.text.split(/\r?\n/).slice(1)
    for (const line of lines) {
      const title = line.split(',').slice(2).join(',').trim()
      if (title) out.platformTopics.push(...classify(title))
    }
  }

  for (const s of out.searches) out.platformTopics.push(...classify(s.query))
  return out
}
