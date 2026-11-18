
import type { ParsedExport } from '../types'
import { parseInstagram } from './instagram'
import { parseTikTok } from './tiktok'
import { parseYouTube } from './youtube'
import type { ExportFile } from './util'

export type { ExportFile }

const USEFUL = /\.(json|csv|html)$/i
const MAX_FILE_BYTES = 80 * 1024 * 1024

/** Read the useful text files from a ZIP, or a single JSON/CSV/HTML file. */
export async function readUpload(file: File): Promise<ExportFile[]> {
  if (/\.zip$/i.test(file.name) || file.type.includes('zip')) {
    const { default: JSZip } = await import('jszip') // load only when needed
    const zip = await JSZip.loadAsync(file)
    const entries = Object.values(zip.files).filter((e) => !e.dir && USEFUL.test(e.name) && !/__MACOSX/.test(e.name))
    const out: ExportFile[] = []
    for (const e of entries) {
      // Skip very large files we do not need (for example message archives).
      const size = (e as unknown as { _data?: { uncompressedSize?: number } })._data?.uncompressedSize ?? 0
      if (size > MAX_FILE_BYTES) continue
      if (/messages|inbox|media\//i.test(e.name)) continue
      out.push({ name: e.name, text: await e.async('string') })
    }
    return out
  }
  if (USEFUL.test(file.name)) return [{ name: file.name, text: await file.text() }]
  return []
}

/** Run every parser. Return only platforms that found data. */
export function parseAll(files: ExportFile[]): ParsedExport[] {
  return [parseTikTok(files), parseYouTube(files), parseInstagram(files)].filter(
    (p) => p.items.length || p.searches.length || p.platformTopics.length || p.creatorViews.length,
  )
}
