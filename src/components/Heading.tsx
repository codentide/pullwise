import type { ComponentProps } from 'react'

/** The heading levels the system defines — keeping them here stops the scale drifting one size at a time, and the lint rule banning raw <h1>-<h6> in routes means extending this file is the only way to add one. */
const LEVELS = {
  /** 32px display — page titles that carry weight. */
  title: 'font-display text-title font-extrabold tracking-tight text-ink-high',
  /** 20px — section headings. */
  page: 'font-display text-section font-semibold tracking-tight text-ink-high',
  section: 'text-section font-semibold text-ink-high',
  sub: 'text-meta font-medium text-ink-high',
  /** Game names: display face, but always mono-cased English from the game. */
  gameName: 'game-name font-display text-section font-semibold text-ink-high',
  /** Small caps label above a block. */
  eyebrow: 'font-mono text-label uppercase tracking-[0.14em] text-ink-low'
} as const

export function Heading ({
  level,
  as,
  className = '',
  ...props
}: ComponentProps<'h2'> & { level: keyof typeof LEVELS, as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' }) {
  const Tag = as ?? (level === 'title' || level === 'page' ? 'h1' : level === 'section' ? 'h2' : 'h3')
  return <Tag {...props} className={`${LEVELS[level]} ${className}`} />
}
