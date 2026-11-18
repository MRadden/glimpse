import type { FeedItem } from '../types'
import { classify } from './topics'

/**
 * TikTok's browsing history has links only, no titles. TikTok has a public
 * oEmbed service that gives the caption and author for a video. We call it
 * for a limited number of videos. If it fails, the video keeps no title.
 */
export async function enrichTikTok(
  items: FeedItem[],
  opts: { limit?: number; concurrency?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<FeedItem[]> {
  const limit = opts.limit ?? 150
  const todo = items.filter((i) => i.platform === 'tiktok' && !i.title).slice(0, limit)
  let done = 0
  const queue = [...todo]
  const worker = async () => {
    while (queue.length) {
      const it = queue.shift()!
      try {
        const ctrl = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 6000)
        const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(it.url)}`, { signal: ctrl.signal })
        clearTimeout(timer)
        if (res.ok) {
          const data = (await res.json()) as { title?: string; author_name?: string; author_unique_id?: string }
          it.title = data.title?.trim() || undefined
          it.creator = data.author_unique_id ? '@' + data.author_unique_id : data.author_name
          it.topics = classify(it.title, it.creator)
        }
      } catch {
        // Network error or blocked. Keep the item as it is.
      }
      opts.onProgress?.(++done, todo.length)
    }
  }
  await Promise.all(Array.from({ length: opts.concurrency ?? 6 }, worker))
  return items
}
