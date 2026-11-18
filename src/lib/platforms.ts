import type { FeedItem, ParsedExport, Platform, Profile } from '../types'
import { buildProfile } from './score'

export const PLATFORM_ORDER: Platform[] = ['tiktok', 'instagram', 'youtube']

export const PLATFORM_NAMES: Record<Platform, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
}

/** The apps that have posts in a feed, in a fixed order. */
export function platformsOf(items: Pick<FeedItem, 'platform'>[]): Platform[] {
  const set = new Set(items.map((i) => i.platform))
  return PLATFORM_ORDER.filter((p) => set.has(p))
}

/** "TikTok", "TikTok + Instagram", "TikTok, Instagram + YouTube". */
export function feedLabel(platforms: Platform[]): string {
  const names = PLATFORM_ORDER.filter((p) => platforms.includes(p)).map((p) => PLATFORM_NAMES[p])
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} + ${names[names.length - 1]}`
}

/** The profile built only from the apps the owner wants to share. */
export function profileFor(exports: ParsedExport[], hidden: ReadonlySet<Platform>): Profile {
  return buildProfile(exports.filter((e) => !hidden.has(e.platform)))
}
