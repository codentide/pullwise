import type { ReactNode } from 'react'
import { Icon } from './Icon.tsx'

/**
 * A hint or warning with actual body.
 *
 * Coloured text on its own reads as an afterthought — three of them stacked read
 * as one paragraph that happens to change colour. A tinted ground gives each one
 * an edge, and pulling the icon into its own column lets the text wrap under
 * itself instead of around the glyph.
 *
 * The tint is the state colour at low alpha over the surface, so it stays legible
 * in both themes without a second palette.
 */
export type NoticeTone = 'error' | 'warning' | 'info' | 'success'

const TONES: Record<NoticeTone, { box: string, icon: string, glyph: 'warn' | 'check' }> = {
  error: { box: 'bg-invalid/10 text-invalid', icon: 'text-invalid', glyph: 'warn' },
  warning: { box: 'bg-warn/10 text-warn', icon: 'text-warn', glyph: 'warn' },
  info: { box: 'bg-overlay text-ink-mid', icon: 'text-ink-low', glyph: 'warn' },
  success: { box: 'bg-valid/10 text-valid', icon: 'text-valid', glyph: 'check' }
}

export function Notice ({
  tone = 'info',
  children,
  action
}: {
  tone?: NoticeTone
  children: ReactNode
  /** Optional trailing control — the fix, when there is one. */
  action?: ReactNode
}) {
  const style = TONES[tone]

  return (
    <div
      className={`flex items-start gap-3 rounded-control px-3 py-2 text-meta leading-relaxed ${style.box}`}
      role={tone === 'error' ? 'alert' : undefined}
    >
      <Icon name={style.glyph} size={14} className={`mt-1 shrink-0 ${style.icon}`} />
      <div className='min-w-0 flex-1'>{children}</div>
      {action != null && <div className='shrink-0'>{action}</div>}
    </div>
  )
}

/** A stack of notices, separated enough to read as separate statements. */
export function NoticeList ({ children }: { children: ReactNode }) {
  return <div className='flex flex-col gap-2'>{children}</div>
}
