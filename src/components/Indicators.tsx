import type { ComponentProps, ReactNode } from 'react'

/**
 * Read-only indicators. Three things in the app were doing the badge job with
 * three different class strings — the estimated marker, the rarity tag and the
 * copy counter — so the tones are named by meaning, not by colour.
 */
type Tone = 'neutral' | 'accent' | 'have' | 'miss' | 'warn'

const TONES: Record<Tone, string> = {
  neutral: 'bg-overlay text-ink-mid',
  accent: 'bg-accent-wash text-accent',
  have: 'bg-valid/12 text-valid',
  miss: 'bg-invalid/12 text-invalid',
  warn: 'bg-warn/12 text-warn'
}

export function Badge ({
  tone = 'neutral',
  className = '',
  ...props
}: ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      {...props}
      className={`inline-flex items-center gap-0.5 rounded-chip px-1 text-label font-medium ${TONES[tone]} ${className}`}
    />
  )
}

/** A figure with its label. The unit is required: a bare number is never enough. */
export function Stat ({
  label,
  value,
  detail,
  emphasis = false
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  emphasis?: boolean
}) {
  return (
    <div>
      <p className='text-label uppercase tracking-wide text-ink-low'>{label}</p>
      <p className='tnum mt-1 flex items-baseline gap-2'>
        <span
          className={`font-semibold leading-none text-ink-high ${emphasis ? 'text-hero' : 'text-body'}`}
        >
          {value}
        </span>
        {detail != null && <span className='text-meta text-ink-mid'>{detail}</span>}
      </p>
    </div>
  )
}

/** Proportional bar. Purely decorative: the number beside it carries the meaning. */
export function Bar ({ value, highlight = false }: { value: number, highlight?: boolean }) {
  return (
    <div aria-hidden className='h-1 overflow-hidden rounded-full bg-overlay'>
      <div
        className={`h-full rounded-full ${highlight ? 'bg-accent' : 'bg-line-control'}`}
        style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }}
      />
    </div>
  )
}

/** Toggle-style filter. Pressed state is announced, not just coloured. */
export function Chip ({
  pressed,
  className = '',
  ...props
}: ComponentProps<'button'> & { pressed: boolean }) {
  return (
    <button
      {...props}
      aria-pressed={pressed}
      className={`flex items-center gap-1 rounded-control px-1.5 py-1 text-label transition-colors duration-150 ${
        pressed ? 'bg-overlay text-ink-high' : 'text-ink-low hover:bg-overlay'
      } ${className}`}
    />
  )
}
