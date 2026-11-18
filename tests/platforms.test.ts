import { describe, expect, it } from 'vitest'
import { PERSONAS } from '../src/demo/personas'
import { feedLabel, platformsOf, profileFor } from '../src/lib/platforms'
import { buildProfile, pickFeed } from '../src/lib/score'

describe('app names', () => {
  it('names one, two or three apps in a fixed order', () => {
    expect(feedLabel([])).toBe('')
    expect(feedLabel(['tiktok'])).toBe('TikTok')
    expect(feedLabel(['instagram', 'tiktok'])).toBe('TikTok + Instagram')
    expect(feedLabel(['youtube', 'instagram', 'tiktok'])).toBe('TikTok, Instagram + YouTube')
  })
  it('finds the apps that have posts in a feed', () => {
    expect(platformsOf([{ platform: 'youtube' }, { platform: 'tiktok' }, { platform: 'youtube' }])).toEqual(['tiktok', 'youtube'])
  })
})

describe('leaving an app out', () => {
  const jordan = PERSONAS[0].exports
  it('demo data has three apps', () => {
    expect(platformsOf(buildProfile(jordan).items)).toEqual(['tiktok', 'instagram', 'youtube'])
  })
  it('removes the app from the feed, creators and interests', () => {
    const all = buildProfile(jordan)
    const noTikTok = profileFor(jordan, new Set(['tiktok']))
    expect(pickFeed(noTikTok.items).some((i) => i.platform === 'tiktok')).toBe(false)
    expect(noTikTok.creators.some((c) => c.platform === 'tiktok')).toBe(false)
    expect(noTikTok.platforms).toEqual(expect.not.arrayContaining(['tiktok']))
    // TikTok held most of Jordan's comedy, so its share drops without TikTok.
    const share = (p: typeof all, t: string) => p.interests.find((i) => i.topic === t)?.share ?? 0
    expect(share(noTikTok, 'Comedy')).toBeLessThan(share(all, 'Comedy'))
  })
})
