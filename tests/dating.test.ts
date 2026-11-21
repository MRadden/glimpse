import { describe, expect, it } from 'vitest'
import { datingChatText, joinWaitlist, rateMatch, waitlistProblems } from '../src/dating/api'

function fakeServer(reply: unknown, status = 200) {
  const calls: { url: string; body: Record<string, unknown> }[] = []
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(init.body as string) })
    return new Response(JSON.stringify(reply), { status })
  }) as unknown as typeof fetch
  return { f, calls, opts: { url: 'https://demo.supabase.co', key: 'sb_publishable_test', fetch: f } }
}

describe('waitlist form', () => {
  const ok = { email: 'a@b.co', city: 'Denver', ageRange: '25-34' as const, adult: true, consent: true }
  it('accepts a complete entry', () => {
    expect(waitlistProblems(ok)).toEqual([])
  })
  it('names each problem', () => {
    expect(waitlistProblems({ ...ok, email: 'nope' })).toEqual(['Enter a valid email address.'])
    expect(waitlistProblems({ ...ok, adult: false })).toEqual(['You must be 18 or older.'])
    expect(waitlistProblems({ ...ok, consent: false })).toEqual(['Agree that we can email you when matching opens.'])
    expect(waitlistProblems({})).toHaveLength(5)
  })
})

describe('dating server calls', () => {
  it('joins the waitlist and returns the count for the city', async () => {
    const s = fakeServer(7)
    const n = await joinWaitlist({ email: ' A@B.co ', city: ' Denver ', ageRange: '25-34', glimpseId: 'Ab3dEf7hJk' }, s.opts)
    expect(n).toBe(7)
    expect(s.calls[0].url).toBe('https://demo.supabase.co/rest/v1/rpc/join_waitlist')
    expect(s.calls[0].body).toEqual({ p_email: 'A@B.co', p_city: 'Denver', p_age_range: '25-34', p_glimpse_id: 'Ab3dEf7hJk' })
  })
  it('reports a server error on the waitlist', async () => {
    const s = fakeServer({ message: 'Email is not valid' }, 400)
    await expect(joinWaitlist({ email: 'x@y.z', city: 'Denver', ageRange: '18-24' }, s.opts)).rejects.toMatchObject({ kind: 'server' })
  })
  it('saves a match rating', async () => {
    const s = fakeServer(null)
    await rateMatch('Ab3dEf7hJk', 'Zz9zZz9zZz', 38.4, 'somewhat', s.opts)
    expect(s.calls[0].body).toEqual({ p_a: 'Ab3dEf7hJk', p_b: 'Zz9zZz9zZz', p_score: 38, p_rating: 'somewhat' })
  })
})

describe('dating chat text', () => {
  it('names the apps and includes the link', () => {
    const t = datingChatText(15, 'TikTok + Instagram', 'https://x.io/#/g/Ab3dEf7hJk')
    expect(t).toContain('15-minute glimpse into my TikTok + Instagram feed')
    expect(t).toContain('https://x.io/#/g/Ab3dEf7hJk')
  })
})
