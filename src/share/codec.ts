import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'
import type { FeedItem, Platform, Signal, Snapshot } from '../types'

/**
 * The snapshot travels inside the share link (after the #), so the prototype
 * needs no server. The part after # is never sent to a web server.
 * We pack it into short arrays and compress it.
 */
const P: Platform[] = ['tiktok', 'youtube', 'instagram']
const S: Signal[] = ['watched', 'liked', 'saved']

type Packed = {
  v: 1
  o: string
  m: number
  c: number
  t: string[] // topic names, referenced by index
  i: [number, number][] // [topic index, share in 1/1000]
  k: [string, number, number][] // [creator, platform, count]
  p: [number, string, string, string, number[], number, number][] // [platform, ref, title, creator, topics, signal, demo]
}

function ref(it: FeedItem): string {
  if (it.demo) return it.id
  if (it.platform === 'tiktok') return it.id.replace(/^tt-/, '')
  if (it.platform === 'youtube') return it.id.replace(/^yt-/, '')
  return (/\/reel\//.test(it.url) ? 'r/' : 'p/') + it.id.replace(/^ig-/, '')
}

function unref(platform: Platform, r: string, demo: boolean): Pick<FeedItem, 'id' | 'url' | 'embedUrl'> {
  if (demo) return { id: r, url: '' }
  if (platform === 'tiktok')
    return { id: `tt-${r}`, url: `https://www.tiktok.com/@/video/${r}`, embedUrl: `https://www.tiktok.com/embed/v2/${r}` }
  if (platform === 'youtube')
    return {
      id: `yt-${r}`,
      url: `https://www.youtube.com/watch?v=${r}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${r}?playsinline=1&rel=0&modestbranding=1`,
    }
  const [k, code] = r.split('/')
  const kind = k === 'r' ? 'reel' : 'p'
  return { id: `ig-${code}`, url: `https://www.instagram.com/${kind}/${code}/`, embedUrl: `https://www.instagram.com/${kind}/${code}/embed/` }
}

export function encodeSnapshot(s: Snapshot): string {
  const topics: string[] = []
  const ti = (t: string) => {
    let i = topics.indexOf(t)
    if (i < 0) i = topics.push(t) - 1
    return i
  }
  const packed: Packed = {
    v: 1,
    o: s.owner,
    m: s.minutes,
    c: Math.round(s.createdAt / 1000),
    t: topics,
    i: s.interests.map((x) => [ti(x.topic), Math.round(x.share * 1000)]),
    k: s.creators.map((c) => [c.name, P.indexOf(c.platform), c.count]),
    p: s.items.map((it) => [
      P.indexOf(it.platform),
      ref(it),
      (it.title ?? '').slice(0, 140),
      it.creator ?? '',
      it.topics.slice(0, 3).map(ti),
      S.indexOf(it.signal),
      it.demo ? 1 : 0,
    ]),
  }
  return compressToEncodedURIComponent(JSON.stringify(packed))
}

export function decodeSnapshot(data: string): Snapshot | null {
  try {
    const json = decompressFromEncodedURIComponent(data)
    if (!json) return null
    const p = JSON.parse(json) as Packed
    if (p.v !== 1) return null
    return {
      owner: p.o,
      minutes: p.m,
      createdAt: p.c * 1000,
      interests: p.i.map(([t, s]) => ({ topic: p.t[t], share: s / 1000 })),
      creators: p.k.map(([name, pl, count]) => ({ name, platform: P[pl], count })),
      items: p.p.map(([pl, r, title, creator, topics, sig, demo]) => ({
        ...unref(P[pl], r, !!demo),
        platform: P[pl],
        title: title || undefined,
        creator: creator || undefined,
        topics: topics.map((t) => p.t[t]),
        signal: S[sig],
        demo: !!demo || undefined,
      })),
    }
  } catch {
    return null
  }
}

/** Build the full link to the viewer. */
export function shareUrl(s: Snapshot): string {
  const base = window.location.href.split('#')[0]
  return `${base}#/v/${encodeSnapshot(s)}`
}
