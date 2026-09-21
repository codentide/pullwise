import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Layers,
  LayoutGrid,
  Minus,
  Moon,
  Package,
  Copy,
  Info,
  Plus,
  QrCode,
  Search,
  Sun,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon
} from 'lucide-react'

/**
 * UI iconography, from Lucide.
 *
 * The name → icon mapping lives here rather than at the call sites, so swapping
 * the source is one file and not forty. The names are ours and describe the role
 * in this product ('pack', 'deck'), not the shape Lucide happens to give them —
 * which is what lets the shapes change without the meaning moving.
 *
 * Energy symbols are not here: those are in EnergyIcon, drawn by hand, because
 * no general icon set carries the ten TCG energies.
 */
type Name =
  | 'deck' | 'pack' | 'cards' | 'plus' | 'minus'
  | 'close' | 'check' | 'search' | 'warn' | 'trash'
  | 'back' | 'evolvesTo' | 'chevron' | 'sun' | 'moon' | 'getCode' | 'copy' | 'hint'

const ICONS: Record<Name, LucideIcon> = {
  deck: Layers,
  pack: Package,
  cards: LayoutGrid,
  plus: Plus,
  minus: Minus,
  close: X,
  check: Check,
  search: Search,
  warn: TriangleAlert,
  trash: Trash2,
  back: ArrowLeft,
  // The link between two cards in an evolution chain, not a direction on screen.
  evolvesTo: ArrowRight,
  getCode: QrCode,
  copy: Copy,
  hint: Info,
  chevron: ChevronDown,
  sun: Sun,
  moon: Moon
}

interface Props {
  name: Name
  size?: number
  label?: string
  className?: string
}

export function Icon ({ name, size = 16, label, className }: Props) {
  const Glyph = ICONS[name]
  return (
    <Glyph
      size={size}
      strokeWidth={1.75}
      className={className}
      aria-hidden={label != null ? undefined : true}
      aria-label={label}
      role={label != null ? 'img' : undefined}
    />
  )
}
