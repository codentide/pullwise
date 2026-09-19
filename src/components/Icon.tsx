/**
 * Inline SVG icons. There are nine of them and they are tiny: pulling in a whole
 * icon library for that many strokes does not pay for itself. All inherit
 * currentColor and are decorative unless given a label.
 */
type Name =
  | 'deck' | 'pack' | 'cards' | 'plus' | 'minus'
  | 'close' | 'check' | 'search' | 'warn' | 'trash' | 'back' | 'chevron' | 'sun' | 'moon'

const PATHS: Record<Name, string> = {
  deck: 'M4 5h10v12H4zM7 3h10v12',
  pack: 'M4 7l8-3 8 3v10l-8 3-8-3zM4 7l8 3 8-3M12 10v10',
  cards: 'M3 6h7v12H3zM14 6h7v12h-7z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 13l4 4L19 7',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  warn: 'M12 4l9 16H3zM12 10v4M12 17v.5',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  back: 'M15 5l-7 7 7 7',
  chevron: 'M6 9l6 6 6-6',
  sun: 'M12 4v2M12 18v2M4 12H2M22 12h-2M6 6L4.5 4.5M19.5 19.5L18 18M18 6l1.5-1.5M4.5 19.5L6 18M12 8a4 4 0 100 8 4 4 0 000-8z',
  moon: 'M20 14a8 8 0 01-10-10 9 9 0 1010 10z'
}

interface Props {
  name: Name
  size?: number
  label?: string
  className?: string
}

export function Icon ({ name, size = 16, label, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={1.75}
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      aria-hidden={label != null ? undefined : true}
      aria-label={label}
      role={label != null ? 'img' : undefined}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
