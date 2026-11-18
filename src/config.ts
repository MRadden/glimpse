/**
 * Supabase settings for short share links.
 * The URL and the publishable (anon) key are public by design: every visitor's
 * browser needs them. Never put the secret key or the database password here.
 * Leave them empty to use long links (the snapshot inside the link).
 */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY || ''

export const cloudEnabled = () => Boolean(SUPABASE_URL && SUPABASE_KEY)
