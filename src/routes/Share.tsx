import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Card, H1, Screen, SectionTitle, Serif } from '../components/ui'
import { cloudEnabled } from '../config'
import { createShortId, shortUrl, ShortLinkError } from '../share/cloud'
import { shareUrl } from '../share/codec'
import { feedLabel, platformsOf } from '../lib/platforms'
import { useStore } from '../store'

const TIMES = [5, 15, 30]

type LinkState = { status: 'idle' } | { status: 'busy' } | { status: 'ready'; url: string } | { status: 'error'; message: string }

export default function Share() {
  const nav = useNavigate()
  const s = useStore()
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [link, setLink] = useState<LinkState>({ status: 'idle' })
  const made = link.status === 'ready'
  const url = link.status === 'ready' ? link.url : ''
  const myId = url.match(/#\/g\/([A-Za-z0-9]{10})$/)?.[1]
  const target = s.compareWith && myId && s.compareWith.id !== myId ? s.compareWith : null
  // A new name or time limit needs a new link.
  const resetLink = () => setLink({ status: 'idle' })

  const createLink = async () => {
    const snap = s.snapshot()
    if (!cloudEnabled()) {
      setLink({ status: 'ready', url: shareUrl(snap) })
      return
    }
    setLink({ status: 'busy' })
    try {
      setLink({ status: 'ready', url: shortUrl(await createShortId(snap)) })
    } catch (e) {
      setLink({ status: 'error', message: e instanceof ShortLinkError ? e.message : 'Something went wrong. Try again.' })
    }
  }

  useEffect(() => {
    if (!url) return
    QRCode.toDataURL(url, { margin: 1, width: 360, errorCorrectionLevel: 'M', color: { dark: '#0b0b12', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(''))
  }, [url])

  if (!s.profile) return <Navigate to="/" replace />

  const name = s.owner.trim() || 'Someone'
  const apps = feedLabel(platformsOf(s.feed))
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
      await navigator.share({ title: `${name}'s Glimpse`, text: `Take a ${s.minutes}-minute glimpse into my ${apps ? apps + ' ' : ''}feed 👀`, url })
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
            resetLink()
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
                resetLink()
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
        <>
          <Button onClick={createLink} disabled={link.status === 'busy'}>
            {link.status === 'busy' ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Creating your link…
              </>
            ) : link.status === 'error' ? (
              'Try again'
            ) : (
              'Create my link'
            )}
          </Button>
          {link.status === 'error' && (
            <p role="alert" className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-center text-[14px] text-red-100">
              {link.message}
            </p>
          )}
          {cloudEnabled() && (
            <p className="mt-3 px-2 text-center text-xs leading-relaxed text-muted/80">
              🔒 Only the posts you approved are stored. The link expires in 7 days.
            </p>
          )}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onAnimationComplete={() => document.getElementById('share-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          id="share-result"
          className="space-y-3"
        >
          {target && (
            <Card className="!border-pink/30 bg-pink/[0.06]">
              <p className="text-[15px] font-semibold">Ready to compare with {target.owner}</p>
              <p className="mt-1 mb-4 text-[13px] leading-snug text-muted">See your two interest maps side by side, then send the comparison to {target.owner}.</p>
              <Button
                onClick={() => {
                  s.setCompareWith(null)
                  nav(`/c/${target.id}/${myId}`)
                }}
              >
                Compare with {target.owner}
              </Button>
            </Card>
          )}
          <Card className="flex flex-col items-center">
            {qr ? <img src={qr} alt="QR code for the share link" className="h-48 w-48 rounded-2xl bg-white p-2" /> : <div className="h-48 w-48 animate-pulse rounded-2xl bg-white/10" />}
            <p className="mt-3 text-center text-[13px] text-muted">
              Let them scan it, or send the link. {apps ? `${apps} · ` : ''}{s.feed.length} posts · {s.minutes} min
              {cloudEnabled() ? ' · expires in 7 days' : ''}
            </p>
            <p className="mt-2 max-w-full truncate rounded-lg bg-white/[0.05] px-3 py-1.5 text-[12px] text-white/70" data-testid="share-url">
              {url.replace(/^https?:\/\//, '')}
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
