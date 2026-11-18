import { SUPABASE_KEY, SUPABASE_URL } from '../config'
import type { Snapshot } from '../types'
import { decodeSnapshot, encodeSnapshot } from './codec'

export type CloudError = 'network' | 'not-found' | 'server'

export class ShortLinkError extends Error {
  readonly kind: CloudError
  constructor(kind: CloudError, message: string) {
    super(message)
    this.kind = kind
  }
}

export const SHORT_ID = /^[A-Za-z0-9]{10}$/

interface CloudOptions {
  url?: string
  key?: string
  fetch?: typeof fetch
}

async function rpc(name: string, body: object, opts: CloudOptions): Promise<unknown> {
  const url = (opts.url ?? SUPABASE_URL).replace(/\/$/, '')
  const key = opts.key ?? SUPABASE_KEY
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' }
  // Older "anon" keys are JWTs and also go in the Authorization header.
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  let res: Response
  try {
    res = await (opts.fetch ?? fetch)(`${url}/rest/v1/rpc/${name}`, { method: 'POST', headers, body: JSON.stringify(body) })
  } catch {
    throw new ShortLinkError('network', 'Could not reach the server. Check your internet and try again.')
  }
  if (!res.ok) throw new ShortLinkError('server', `The server did not accept the request (${res.status}).`)
  return res.json()
}

/** Store the snapshot online. Returns its short ID. */
export async function createShortId(snap: Snapshot, opts: CloudOptions = {}): Promise<string> {
  const id = await rpc('create_snapshot', { p_data: encodeSnapshot(snap) }, opts)
  if (typeof id !== 'string' || !SHORT_ID.test(id)) throw new ShortLinkError('server', 'The server sent an unexpected answer.')
  return id
}

/** Get a snapshot by its short ID. */
export async function loadShortId(id: string, opts: CloudOptions = {}): Promise<Snapshot> {
  if (!SHORT_ID.test(id)) throw new ShortLinkError('not-found', 'This link is not complete.')
  const data = await rpc('get_snapshot', { p_id: id }, opts)
  if (typeof data !== 'string') throw new ShortLinkError('not-found', 'This glimpse has expired or was removed.')
  const snap = decodeSnapshot(data)
  if (!snap) throw new ShortLinkError('server', 'This glimpse could not be read.')
  return snap
}

export function shortUrl(id: string): string {
  return `${window.location.href.split('#')[0]}#/g/${id}`
}
