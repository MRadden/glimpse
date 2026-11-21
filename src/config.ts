/**
 * Supabase settings for short share links.
 * The URL and the publishable (anon) key are public by design: every visitor's
 * browser needs them. Never put the secret key or the database password here.
 * Set both to '' to use long links (the snapshot inside the link).
 */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || 'https://omcjobdkshusgssrinta.supabase.co'
export const SUPABASE_KEY: string = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_-zYZmmfIE0_EcYKVCY4Sgw_7ufzle9e'

export const cloudEnabled = () => Boolean(SUPABASE_URL && SUPABASE_KEY)

/**
 * Dating test: the city where matching opens first. Leave it empty to ask
 * each person for their city with no suggestion.
 */
export const FOCUS_CITY: string = ''
