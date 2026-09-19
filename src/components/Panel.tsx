import type { ComponentProps } from 'react'

/** A raised surface. Padding is the only thing that varied across its four uses. */
export function Panel ({
  pad = 'md',
  className = '',
  ...props
}: ComponentProps<'div'> & { pad?: 'sm' | 'md' }) {
  return (
    <div
      {...props}
      className={`rounded-surface border border-line bg-raised ${pad === 'sm' ? 'p-3' : 'p-4'} ${className}`}
    />
  )
}

/**
 * A list whose rows are separated by hairlines. The trick is a 1px gap over a
 * line-coloured ground rather than borders per row, so the first and last rows
 * need no special casing.
 */
export function HairlineList ({ className = '', ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      {...props}
      className={`flex flex-col gap-px overflow-hidden rounded-surface border border-line bg-line ${className}`}
    />
  )
}

export function HairlineRow ({ className = '', ...props }: ComponentProps<'li'>) {
  return <li {...props} className={`flex items-center gap-3 bg-raised px-3 py-2.5 ${className}`} />
}

/** Dashed placeholder for "there is nothing here yet". */
export function EmptyState ({ className = '', ...props }: ComponentProps<'div'>) {
  return (
    <div
      {...props}
      className={`rounded-surface border border-dashed border-line-strong px-6 py-12 text-center ${className}`}
    />
  )
}
