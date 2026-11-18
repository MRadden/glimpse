export type Platform = 'tiktok' | 'youtube' | 'instagram'
export type Signal = 'watched' | 'liked' | 'saved'

/** One post or video from a person's history. */
export interface FeedItem {
  id: string
  platform: Platform
  url: string
  embedUrl?: string
  title?: string
  creator?: string
  time?: number // epoch ms
  signal: Signal
  topics: string[]
  /** Demo items have no real post; the app draws a styled card. */
  demo?: boolean
}

export interface SearchEntry {
  platform: Platform
  query: string
  time?: number
}

/** Result of reading one platform's export. */
export interface ParsedExport {
  platform: Platform
  items: FeedItem[]
  searches: SearchEntry[]
  /** Topic names that the platform itself assigned to the person. */
  platformTopics: string[]
  /** Creators seen without a link (for example Instagram "posts viewed"). */
  creatorViews: { name: string; time?: number }[]
  files: string[]
}

export interface InterestScore {
  topic: string
  share: number // 0..1
}

export interface CreatorScore {
  name: string
  platform: Platform
  count: number
}

export interface Profile {
  items: FeedItem[]
  interests: InterestScore[]
  creators: CreatorScore[]
  searches: SearchEntry[]
  platforms: Platform[]
  stats: { watched: number; liked: number; searches: number }
}

/** What the owner shares. It goes into the link. */
export interface Snapshot {
  owner: string
  minutes: number
  createdAt: number
  interests: InterestScore[]
  creators: CreatorScore[]
  items: FeedItem[]
}
