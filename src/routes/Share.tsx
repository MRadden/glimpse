import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Card, H1, Screen, SectionTitle, Serif } from '../components/ui'
import { shareUrl } from '../share/codec'
import { useStore } from '../store'

const TIMES = [5, 15, 30]

export default function Share() {
  const nav = useNavigate()
  const s = useStore()
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [made, setMade] = useState(false)
  // Rebuild the link only when the choices change.
  const url = useMemo(() => (s.profile ? shareUrl(s.snapshot()) : ''), [s.profile, s.owner, s.minutes, s.feed, s.interests, s.creators]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!made || !url) return
    QRCode.toDataURL(url, { margin: 1, width: 360, errorCorrectionLevel: 'L', color: { dark: '#0b0b12', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''))
  }, [made, url])

  if (!s.profile) return <Navigate to="/" replace />

  const name = s.owner.trim() || 'Someone'
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('Copy this link', url)
    }
  }
  const nativeShare = async () => {
    try {
      await navigator.share({ title: `${name}'s Glimpse`, text: `Take a ${s.minutes}-minute glimpse into my feed 👀`, url })
    } catch {
      /* the person closed the share sheet */
    }
  }

  return (
    <Screen back="/curate" step={[4, 4]}>
      <H1 sub="They get a read-only feed. Nothing they do changes your real algorithm.">
        Share your <Serif>glimpse</Serif>
      </H1>

      <Card className="mb-4">
        <label htmlFor="owner" className="mb-2 block text-[13px] font-semibold tracking-wider text-muted uppercase">
          Your name
        </label>
        <input
          id="owner"
          value={s.owner}
          onChange={(e) => {
            s.setOwner(e.target.value.slice(0, 30))
            setMade(false)
          }}
          placeholder="What should they call you?"
          className="h-12 w-full rounded-xl bg-white/[0.05] px-4 text-[16px] outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-pink/60"
        />
      </Card>

      <Card className="mb-5">
        <SectionTitle>Time limit</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {TIMES.map((m) => (
            <button
              key={m}
              onClick={() => {
                s.setMinutes(m)
                setMade(false)
              }}
              aria-pressed={s.minutes === m}
              className={`rounded-2xl py-3 transition ${s.minutes === m ? 'bg-white text-black' : 'bg-white/[0.05] text-white'}`}
            >
              <span className="block text-[22px] font-semibold tabular-nums">{m}</span>
              <span className="text-[11px] opacity-70">minutes</span>
            </button>
          ))}
        </div>
      </Card>

      {!made ? (
        <Button onClick={() => setMade(true)}>Create my link</Button>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <Card className="flex flex-col items-center">
            {qr ? <img src={qr} alt="QR code for the share link" className="h-48 w-48 rounded-2xl bg-white p-2" /> : <div className="h-48 w-48 animate-pulse rounded-2xl bg-white/10" />}
            <p className="mt-3 text-center text-[13px] text-muted">
              Let them scan it, or send the link. {s.feed.length} posts · {s.minutes} min
            </p>
          </Card>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={copy}>
              {copied ? 'Copied ✓' : 'Copy link'}
            </Button>
            {typeof navigator.share === 'function' ? (
              <Button onClick={nativeShare}>Send…</Button>
            ) : (
              <Button onClick={copy}>{copied ? 'Copied ✓' : 'Send'}</Button>
            )}
          </div>
          <Button variant="ghost" onClick={() => nav(url.slice(url.indexOf('#') + 1))}>
            👀 Preview what they will see
          </Button>
        </motion.div>
      )}
    </Screen>
  )
}
