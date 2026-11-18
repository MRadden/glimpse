import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, H1, PLATFORM_META, Screen, Serif } from '../components/ui'
import { enrichTikTok } from '../lib/enrich'
import { feedLabel, PLATFORM_NAMES, PLATFORM_ORDER } from '../lib/platforms'
import { parseAll, readUpload } from '../parsers'
import { useStore } from '../store'
import type { ParsedExport } from '../types'

/** "1 post", "2 posts" */
const n = (count: number, one: string, many = one + 's') => `${count} ${count === 1 ? one : many}`

type Phase = { kind: 'idle' } | { kind: 'busy'; label: string; pct?: number } | { kind: 'done' } | { kind: 'error'; msg: string }

export default function Upload() {
  const nav = useNavigate()
  const { load } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [found, setFound] = useState<ParsedExport[]>([])
  const [drag, setDrag] = useState(false)

  async function handle(list: File[]) {
    if (!list.length) return
    try {
      setPhase({ kind: 'busy', label: 'Opening your files…' })
      const files = (await Promise.all(list.map(readUpload))).flat()
      setPhase({ kind: 'busy', label: 'Reading your history…' })
      const parsed = parseAll(files)
      // Keep data from earlier uploads for other platforms.
      const merged = [...found.filter((f) => !parsed.some((p) => p.platform === f.platform)), ...parsed].sort(
        (a, b) => PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform),
      )
      if (!parsed.length) {
        setPhase({ kind: 'error', msg: 'We could not find TikTok, YouTube or Instagram history in this file. Make sure you selected the JSON format.' })
        return
      }
      const tiktok = merged.find((p) => p.platform === 'tiktok')
      if (tiktok?.items.some((i) => !i.title)) {
        setPhase({ kind: 'busy', label: 'Getting TikTok video titles…', pct: 0 })
        // Most recent and liked videos first.
        const ordered = [...tiktok.items].sort((a, b) => (b.signal !== 'watched' ? 1 : 0) - (a.signal !== 'watched' ? 1 : 0) || (b.time ?? 0) - (a.time ?? 0))
        await enrichTikTok(ordered, { limit: 120, onProgress: (d, t) => setPhase({ kind: 'busy', label: 'Getting TikTok video titles…', pct: d / t }) })
      }
      setFound(merged)
      setPhase({ kind: 'done' })
    } catch (e) {
      setPhase({ kind: 'error', msg: `This file could not be opened. ${(e as Error).message}` })
    }
  }

  const ready = phase.kind !== 'busy' && found.length > 0
  const missing = PLATFORM_ORDER.filter((p) => !found.some((f) => f.platform === p)).map((p) => PLATFORM_NAMES[p])

  return (
    <Screen
      back="/guide"
      step={[2, 4]}
      footer={
        <Button
          disabled={!ready}
          onClick={() => {
            load(found)
            nav('/snapshot')
          }}
        >
          {found.length > 1 ? `Mix my ${feedLabel(found.map((f) => f.platform))} feeds` : 'Build my snapshot'}
        </Button>
      }
    >
      <H1 sub="Add one app, or mix several. Posts from all the apps you add are mixed into one feed.">
        Add your <Serif>files</Serif>
      </H1>

      {found.length > 0 && (
        <div className="space-y-2">
          {found.map((f) => (
            <motion.div key={f.platform} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass flex items-center gap-3 rounded-2xl p-4">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PLATFORM_META[f.platform].color }} />
              <div className="flex-1">
                <p className="font-semibold">{PLATFORM_META[f.platform].name}</p>
                <p className="text-[13px] text-muted">
                  {n(f.items.length, 'post')} · {n(f.searches.length, 'search', 'searches')} · {n(new Set(f.platformTopics).size, 'topic')}
                </p>
                <details className="mt-1 text-[12px] text-muted">
                  <summary className="cursor-pointer">{n(f.files.length, 'file')} read</summary>
                  <ul className="mt-1 space-y-0.5 break-all">
                    {f.files.map((name) => (
                      <li key={name}>{name.split('/').pop()}</li>
                    ))}
                  </ul>
                </details>
              </div>
              <button
                onClick={() => setFound((all) => all.filter((x) => x.platform !== f.platform))}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-sm text-white/70"
                aria-label={`Remove ${PLATFORM_META[f.platform].name}`}
              >
                ✕
              </button>
            </motion.div>
          ))}
        </div>
      )}
      <button
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          handle([...e.dataTransfer.files])
        }}
        className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 text-center transition ${found.length ? 'mt-3 py-6' : 'py-12'} ${drag ? 'border-pink bg-pink/10' : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.04]'}`}
      >
        {found.length ? (
          <>
            <p className="text-[16px] font-semibold">+ Add another app</p>
            {missing.length > 0 && <p className="mt-1 text-[13px] text-muted">Mix in {missing.join(' or ')} too</p>}
          </>
        ) : (
          <>
            <div className="bg-brand mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg">⤒</div>
            <p className="text-[16px] font-semibold">Tap to choose a file</p>
            <p className="mt-1 text-[13px] text-muted">ZIP, JSON, CSV or HTML</p>
          </>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept=".zip,.json,.csv,.html,application/zip"
        multiple
        hidden
        onChange={(e) => {
          const picked = [...(e.target.files ?? [])]
          e.target.value = '' // so the same file can be chosen again
          handle(picked)
        }}
      />

      <AnimatePresence mode="wait">
        {phase.kind === 'busy' && (
          <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
            <Card className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-pink" />
              <span className="flex-1 text-[14px]">{phase.label}</span>
              {phase.pct !== undefined && <span className="text-xs text-muted tabular-nums">{Math.round(phase.pct * 100)}%</span>}
            </Card>
          </motion.div>
        )}
        {phase.kind === 'error' && (
          <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-[14px] text-red-100">
            {phase.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-6 text-center text-xs text-muted/80">🔒 Files are read on this device. They are not uploaded.</p>
    </Screen>
  )
}
