import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, H1, PLATFORM_META, Screen, Serif } from '../components/ui'
import { enrichTikTok } from '../lib/enrich'
import { buildProfile } from '../lib/score'
import { parseAll, readUpload } from '../parsers'
import { useStore } from '../store'
import type { ParsedExport } from '../types'

type Phase = { kind: 'idle' } | { kind: 'busy'; label: string; pct?: number } | { kind: 'done' } | { kind: 'error'; msg: string }

export default function Upload() {
  const nav = useNavigate()
  const { load } = useStore()
  const input = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [found, setFound] = useState<ParsedExport[]>([])
  const [drag, setDrag] = useState(false)

  async function handle(list: FileList | null) {
    if (!list?.length) return
    try {
      setPhase({ kind: 'busy', label: 'Opening your files…' })
      const files = (await Promise.all([...list].map(readUpload))).flat()
      setPhase({ kind: 'busy', label: 'Reading your history…' })
      const parsed = parseAll(files)
      // Keep data from earlier uploads for other platforms.
      const merged = [...found.filter((f) => !parsed.some((p) => p.platform === f.platform)), ...parsed]
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

  const ready = phase.kind === 'done' && found.length > 0

  return (
    <Screen
      back="/guide"
      step={[2, 4]}
      footer={
        <Button
          disabled={!ready}
          onClick={() => {
            load(buildProfile(found))
            nav('/snapshot')
          }}
        >
          Build my snapshot
        </Button>
      }
    >
      <H1 sub="Add the ZIP file from TikTok, YouTube or Instagram. You can add more than one.">
        Add your <Serif>files</Serif>
      </H1>

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
          handle(e.dataTransfer.files)
        }}
        className={`flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition ${drag ? 'border-pink bg-pink/10' : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.04]'}`}
      >
        <div className="bg-brand mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-lg">⤒</div>
        <p className="text-[16px] font-semibold">Tap to choose a file</p>
        <p className="mt-1 text-[13px] text-muted">ZIP, JSON, CSV or HTML</p>
      </button>
      <input ref={input} type="file" accept=".zip,.json,.csv,.html,application/zip" multiple hidden onChange={(e) => handle(e.target.files)} />

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

      {found.length > 0 && (
        <div className="mt-5 space-y-2">
          {found.map((f) => (
            <motion.div key={f.platform} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass flex items-center gap-3 rounded-2xl p-4">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PLATFORM_META[f.platform].color }} />
              <div className="flex-1">
                <p className="font-semibold">{PLATFORM_META[f.platform].name}</p>
                <p className="text-[13px] text-muted">
                  {f.items.length} posts · {f.searches.length} searches · {new Set(f.platformTopics).size} topics
                </p>
              </div>
              <span className="text-emerald-400">✓</span>
            </motion.div>
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-muted/80">🔒 Files are read on this device. They are not uploaded.</p>
    </Screen>
  )
}
