import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { boldParts, detectDevice, DEVICES, GUIDES, stepSet } from '../src/guide/steps'

describe('download guide', () => {
  it('has steps for every app on every device', () => {
    for (const guide of Object.values(GUIDES)) {
      for (const d of DEVICES) {
        const set = stepSet(guide, d.id)
        expect(set.steps.length).toBeGreaterThan(3)
        expect(set.next.length).toBeGreaterThan(0)
      }
    }
  })

  it('points only to screenshots that exist', () => {
    for (const guide of Object.values(GUIDES))
      for (const set of Object.values(guide.sets))
        for (const s of set!.steps) if (s.image) expect(existsSync(join(__dirname, '..', 'public', 'guide', s.image)), s.image).toBe(true)
  })

  it('tells people to choose JSON on every set', () => {
    for (const guide of Object.values(GUIDES))
      for (const set of Object.values(guide.sets)) expect(set!.steps.some((s) => /JSON/.test(s.text))).toBe(true)
  })

  it('detects the device from the browser', () => {
    expect(detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('iphone')
    expect(detectDevice('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe('android')
    expect(detectDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('computer')
  })

  it('splits bold button names', () => {
    expect(boldParts('Tap **Profile** now')).toEqual([
      { text: 'Tap ', bold: false },
      { text: 'Profile', bold: true },
      { text: ' now', bold: false },
    ])
  })
})
