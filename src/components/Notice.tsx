import type { ReactNode } from 'react'
import { Icon } from './Icon.tsx'

/** A hint or warning with actual body: a tinted ground gives each one an edge (coloured text alone reads as one paragraph that changes colour when stacked), the icon gets its own column so text wraps under itself not around the glyph, and the tint is the state colour at low alpha so it stays legible in both themes without a second palette. */
export type NoticeTone = 'error' | 'warning' | 'info' | 'success'

const TONES: Record<NoticeTone, { box: string, icon: string, glyph: 'warn' | 'check' }> = {
  error: { box: 'bg-invalid/10 text-invalid', icon: 'text-invalid', glyph: 'warn' },
  warning: { box: 'bg-warn/10 text-warn', icon: 'text-warn', glyph: 'warn' },
  info: { box: 'bg-overlay text-ink-mid', icon: 'text-ink-low', glyph: 'warn' },
  success: { box: 'bg-valid/10 text-valid', icon: 'text-valid', glyph: 'check' }
}

export function Notice ({
  tone = 'info',
  pad = 'sm',
  children,
  action
}: {
  tone?: NoticeTone
  /** `sm` keeps tight vertical padding so a line or two of text doesn't read as a panel; `md` is for a notice with something in it — card art, a control — where `sm`'s padding leaves the content touching the bottom edge. */
  pad?: 'sm' | 'md'
  children: ReactNode
  /** Optional trailing control — the fix, when there is one. */
  action?: ReactNode
}) {
  const style = TONES[tone]

  return (
    <div
      className={`flex items-start gap-3 rounded-control text-meta leading-relaxed ${pad === 'md' ? 'p-3' : 'px-3 py-2'} ${style.box}`}
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
