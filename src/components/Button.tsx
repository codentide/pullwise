/**
 * The two button shapes the app actually uses, extracted because the same class
 * strings appeared verbatim five times across the codebase.
 *
 * Visuals live here and nowhere else: a design system change should touch this
 * file, not every call site.
 */
import type { ComponentProps } from 'react'

type Variant = 'primary' | 'quiet' | 'ghost' | 'danger' | 'dashed' | 'link'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent px-3 py-1.5 text-meta font-medium text-accent-ink hover:opacity-90 disabled:opacity-40',
  quiet:
    'border border-line-control px-2 py-1 text-label text-ink-mid hover:text-ink-high disabled:opacity-40',
  ghost:
    'px-2 py-1 text-meta text-ink-mid hover:bg-overlay hover:text-ink-high disabled:opacity-40',
  danger:
    'bg-invalid px-3 py-1.5 text-meta font-medium text-bg hover:opacity-90 disabled:opacity-40',
  // Full-width affordance for "there could be more here": add cards, add a deck.
  dashed:
    'w-full rounded-surface border border-dashed border-line-strong py-2.5 text-meta text-ink-mid hover:border-line-control hover:text-ink-high',
  link:
    'text-label text-accent underline-offset-4 hover:underline'
}

export function Button ({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-control transition-colors duration-150 ${VARIANTS[variant]} ${className}`}
    />
  )
}
