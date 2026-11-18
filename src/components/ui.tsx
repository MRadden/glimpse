import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PLATFORM_NAMES } from '../lib/platforms'
import type { Platform } from '../types'

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const s = size === 'lg' ? 'text-4xl' : 'text-xl'
  return (
    <div className={`flex items-center gap-2 ${s} font-semibold tracking-tight`}>
      <svg viewBox="0 0 64 64" className={size === 'lg' ? 'h-10 w-10' : 'h-6 w-6'} aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset=".55" stopColor="#ec4899" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <path d="M6 32c6-12 15-18 26-18s20 6 26 18c-6 12-15 18-26 18S12 44 6 32z" fill="none" stroke="url(#lg)" strokeWidth="5" />
        <circle cx="32" cy="32" r="9" fill="url(#lg)" />
      </svg>
      <span>glimpse</span>
    </div>
  )
}

/** Page frame: phone-width column, soft background light, enter animation. */
export function Screen({ children, back, step, footer }: { children: ReactNode; back?: string | true; step?: [number, number]; footer?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="aurora relative min-h-dvh">
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[max(env(safe-area-inset-top),16px)]">
        {(back || step) && (
          <div className="flex h-12 items-center justify-between">
            {back ? (
              <button
                onClick={() => (back === true ? nav(-1) : nav(back))}
                className="glass -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-lg"
                aria-label="Back"
              >
                ‹
              </button>
            ) : (
              <span />
            )}
            {step && (
              <div className="flex gap-1.5" aria-label={`Step ${step[0]} of ${step[1]}`}>
                {Array.from({ length: step[1] }, (_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i < step[0] ? 'bg-brand w-6' : 'w-1.5 bg-white/20'}`} />
                ))}
              </div>
            )}
            <span className="w-9" />
          </div>
        )}
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 flex-col pb-6"
        >
          {children}
        </motion.main>
        {footer && (
          <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-ink via-ink/95 to-transparent px-4 pt-6 pb-[max(env(safe-area-inset-bottom),16px)]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost'; full?: boolean }

export function Button({ variant = 'primary', full = true, className = '', children, ...rest }: BtnProps) {
  const base = 'inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-6 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100'
  const look =
    variant === 'primary'
      ? 'bg-brand text-white shadow-[0_10px_40px_-10px_rgba(236,72,153,0.6)]'
      : 'glass text-white hover:bg-white/[0.07]'
  return (
    <button className={`${base} ${look} ${full ? 'w-full' : ''} ${className}`} {...rest}>
      {children}
    </button>
  )
}

export const PLATFORM_META: Record<Platform, { name: string; color: string; short: string }> = {
  tiktok: { name: PLATFORM_NAMES.tiktok, color: '#25f4ee', short: 'TT' },
  youtube: { name: PLATFORM_NAMES.youtube, color: '#ff3d3d', short: 'YT' },
  instagram: { name: PLATFORM_NAMES.instagram, color: '#e1306c', short: 'IG' },
}

export function PlatformBadge({ platform, className = '' }: { platform: Platform; className?: string }) {
  const m = PLATFORM_META[platform]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.name}
    </span>
  )
}

export function H1({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mt-4 mb-6">
      <h1 className="text-[32px] leading-[1.08] font-semibold tracking-tight">{children}</h1>
      {sub && <p className="mt-3 text-[15px] leading-relaxed text-muted">{sub}</p>}
    </header>
  )
}

export function Serif({ children }: { children: ReactNode }) {
  return <span className="font-display text-[1.12em] font-normal italic">{children}</span>
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl p-5 ${className}`}>{children}</div>
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[13px] font-semibold tracking-wider text-muted uppercase">{children}</h2>
      {right && <span className="text-xs text-muted">{right}</span>}
    </div>
  )
}
