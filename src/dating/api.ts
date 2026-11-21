import { rpc, ShortLinkError, type CloudOptions } from '../share/cloud'

export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'] as const
export type AgeRange = (typeof AGE_RANGES)[number]

export type MatchRating = 'spot-on' | 'somewhat' | 'not-really'

export interface WaitlistEntry {
  email: string
  city: string
  ageRange: AgeRange
  /** The person's own glimpse, if they made one. */
  glimpseId?: string
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Problems with the form, in plain words. Empty when the entry is valid. */
export function waitlistProblems(e: Partial<WaitlistEntry> & { adult?: boolean; consent?: boolean }): string[] {
  const out: string[] = []
  if (!e.email || !EMAIL.test(e.email.trim())) out.push('Enter a valid email address.')
  if (!e.city || e.city.trim().length < 2) out.push('Enter your city.')
  if (!e.ageRange || !AGE_RANGES.includes(e.ageRange)) out.push('Select your age range.')
  if (!e.adult) out.push('You must be 18 or older.')
  if (!e.consent) out.push('Agree that we can email you when matching opens.')
  return out
}

/** Join the waitlist. Returns the number of people on the list in that city. */
export async function joinWaitlist(e: WaitlistEntry, opts?: CloudOptions): Promise<number> {
  const n = await rpc('join_waitlist', { p_email: e.email.trim(), p_city: e.city.trim(), p_age_range: e.ageRange, p_glimpse_id: e.glimpseId ?? null }, opts)
  if (typeof n !== 'number') throw new ShortLinkError('server', 'The server sent an unexpected answer.')
  return n
}

/** Save "Did this match score feel accurate?" */
export async function rateMatch(a: string, b: string, score: number, rating: MatchRating, opts?: CloudOptions): Promise<void> {
  await rpc('rate_match', { p_a: a, p_b: b, p_score: Math.round(score), p_rating: rating }, opts)
}

/** Text to paste into a dating app chat. */
export function datingChatText(minutes: number, apps: string, url: string): string {
  const feed = apps ? `my ${apps} feed` : 'my feed'
  return `Before we meet: here's a ${minutes}-minute glimpse into ${feed} 👀 Swipe through it and tell me what you think. ${url}`
}
