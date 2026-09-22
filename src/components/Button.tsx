/** The two button shapes the app uses, extracted because the same class strings appeared verbatim five times — visuals live here and nowhere else, so a design system change touches this file, not every call site. */
import type { ComponentProps } from 'react'
import { Link } from '@/i18n/navigation.ts'

type Variant = 'primary' | 'quiet' | 'ghost' | 'danger' | 'dashed' | 'link'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent px-3 py-2 text-meta font-medium text-accent-ink hover:opacity-90 disabled:opacity-40',
  quiet:
    'border border-line-control px-2 py-1 text-label text-ink-mid hover:text-ink-high disabled:opacity-40',
  ghost:
    'px-2 py-1 text-meta text-ink-mid hover:bg-overlay hover:text-ink-high disabled:opacity-40',
  danger:
    'bg-invalid px-3 py-2 text-meta font-medium text-bg hover:opacity-90 disabled:opacity-40',
  // Full-width affordance for "there could be more here": add cards, add a deck.
  dashed:
    'w-full rounded-surface border border-dashed border-line-strong py-3 text-meta text-ink-mid hover:border-line-control hover:text-ink-high',
  link:
    'text-label text-accent underline-offset-4 hover:underline'
}

// appearance-none: see the comment on Pressable — same macOS native-chrome bleed-through, just harder to notice on Button's smaller hit areas.
const BASE =
  'inline-flex appearance-none cursor-pointer items-center justify-center gap-2 rounded-control transition-colors duration-150'

export function Button ({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return <button {...props} className={`${BASE} ${VARIANTS[variant]} ${className}`} />
}

/** The same shapes, as a link — a control that navigates has to be an anchor (middle-click, open-in-new-tab, the status bar all come from the element, not an onClick) without restating the look to get them. */
export function ButtonLink ({
  variant = 'primary',
  className = '',
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={`${BASE} ${VARIANTS[variant]} ${className}`} />
}
