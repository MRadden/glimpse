import { describe, expect, it } from 'vitest'
import { createShortId, loadShortId, ShortLinkError } from '../src/share/cloud'
import type { Snapshot } from '../src/types'

const snap: Snapshot = {
  owner: 'Mikey',
  minutes: 5,
  createdAt: 1_790_000_000_000,
  interests: [{ topic: 'Fishing', share: 0.5 }],
  creators: [{ name: 'fishing.daily', platform: 'instagram', count: 3 }],
  items: [
    { id: 'ig-CxYz123AbC', platform: 'instagram', url: 'https://www.instagram.com/p/CxYz123AbC/', embedUrl: 'https://www.instagram.com/p/CxYz123AbC/embed/', creator: 'fishing.daily', signal: 'liked', topics: ['Fishing'] },
  ],
}

/** A small fake Supabase server that keeps rows in memory. */
function fakeSupabase() {
  const rows = new Map<string, string>()
  const calls: { url: string; headers: Record<string, string> }[] = []
  const fetchFn = (async (url: string, init: RequestInit) => {
    const headers = init.headers as Record<string, string>
    calls.push({ url, headers })
    const body = JSON.parse(init.body as string)
    if (url.endsWith('/rpc/create_snapshot')) {
      const id = 'Ab3dEf7hJk'
      rows.set(id, body.p_data)
      return new Response(JSON.stringify(id), { status: 200 })
    }
    if (url.endsWith('/rpc/get_snapshot')) return new Response(JSON.stringify(rows.get(body.p_id) ?? null), { status: 200 })
    return new Response('{}', { status: 404 })
  }) as unknown as typeof fetch
  return { fetchFn, calls, rows }
}

const opts = (f: typeof fetch, key = 'sb_publishable_test') => ({ url: 'https://demo.supabase.co/', key, fetch: f })

describe('short links', () => {
  it('stores a snapshot and reads it back by ID', async () => {
    const server = fakeSupabase()
    const id = await createShortId(snap, opts(server.fetchFn))
    expect(id).toBe('Ab3dEf7hJk')
    expect(server.calls[0].url).toBe('https://demo.supabase.co/rest/v1/rpc/create_snapshot')
    expect(server.calls[0].headers.apikey).toBe('sb_publishable_test')
    expect(server.calls[0].headers.Authorization).toBeUndefined()
    const back = await loadShortId(id, opts(server.fetchFn))
    expect(back.owner).toBe('Mikey')
    expect(back.items[0].embedUrl).toBe(snap.items[0].embedUrl)
  })

  it('sends the Authorization header for older anon keys', async () => {
    const server = fakeSupabase()
    await createShortId(snap, opts(server.fetchFn, 'eyJhbGciOi.test.key'))
    expect(server.calls[0].headers.Authorization).toBe('Bearer eyJhbGciOi.test.key')
  })

  it('reports an expired or unknown link', async () => {
    const server = fakeSupabase()
    await expect(loadShortId('Zz9zZz9zZz', opts(server.fetchFn))).rejects.toMatchObject({ kind: 'not-found' })
    await expect(loadShortId('bad', opts(server.fetchFn))).rejects.toMatchObject({ kind: 'not-found' })
  })

  it('reports a network error', async () => {
    const offline = (async () => {
      throw new TypeError('Failed to fetch')
    }) as unknown as typeof fetch
    const err = await createShortId(snap, opts(offline)).catch((e) => e)
    expect(err).toBeInstanceOf(ShortLinkError)
    expect(err.kind).toBe('network')
  })

  it('reports a server error', async () => {
    const broken = (async () => new Response('nope', { status: 500 })) as unknown as typeof fetch
    await expect(createShortId(snap, opts(broken))).rejects.toMatchObject({ kind: 'server' })
  })
})
