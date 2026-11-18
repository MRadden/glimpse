import type { ParsedExport, Platform } from '../types'

/** A text file from inside an export ZIP. `name` is the full path. */
export interface ExportFile {
  name: string
  text: string
}

export function baseName(path: string): string {
  return path.split('/').pop()!.toLowerCase()
}

export function findFiles(files: ExportFile[], ...names: string[]): ExportFile[] {
  const wanted = names.map((n) => n.toLowerCase())
  return files.filter((f) => wanted.includes(baseName(f.name)))
}

export function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Accepts seconds, milliseconds, or a date string. */
export function toTime(v: unknown): number | undefined {
  if (typeof v === 'number') return v < 1e12 ? v * 1000 : v
  if (typeof v === 'string' && v.trim()) {
    // TikTok writes "2024-03-01 18:22:10" (UTC). Make it ISO.
    const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v) ? v.replace(' ', 'T') + 'Z' : v
    const t = Date.parse(iso)
    return Number.isNaN(t) ? undefined : t
  }
  return undefined
}

/**
 * Walk any JSON value. The callback gets each object and the list of keys
 * that lead to it, so parsers can work even when the layout changes.
 */
export function walk(value: unknown, visit: (obj: Record<string, unknown>, path: string[]) => void, path: string[] = []): void {
  if (Array.isArray(value)) {
    value.forEach((v) => walk(v, visit, path))
  } else if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    visit(obj, path)
    for (const [k, v] of Object.entries(obj)) walk(v, visit, [...path, k])
  }
}

export function emptyExport(platform: Platform): ParsedExport {
  return { platform, items: [], searches: [], platformTopics: [], creatorViews: [], files: [] }
}

/** Decode Instagram's broken text (UTF-8 bytes stored as Latin-1). */
export function fixMojibake(s: string): string {
  if (!/[À-ÿ][\u0080-¿]/.test(s)) return s
  try {
    const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff)
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return s
  }
}
