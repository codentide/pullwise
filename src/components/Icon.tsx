import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Layers,
  LayoutGrid,
  List,
  Minus,
  Moon,
  Package,
  Code2,
  Copy,
  Info,
  Plus,
  QrCode,
  Search,
  Share2,
  Sun,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon
} from 'lucide-react'

/** UI iconography from Lucide, mapped here rather than at call sites so swapping the source is one file, not forty; names describe the role ('pack', 'deck'), not the shape, so shapes can change without the meaning moving. Energy symbols live in EnergyIcon instead, drawn by hand, since no general icon set carries the ten TCG energies. */
type Name =
  | 'deck' | 'pack' | 'cards' | 'plus' | 'minus'
  | 'close' | 'check' | 'search' | 'warn' | 'trash'
  | 'back' | 'evolvesTo' | 'chevron' | 'sun' | 'moon' | 'getCode' | 'copy' | 'hint' | 'sourceCode' | 'list' | 'export'

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
  // No brand logos ship in this icon set anymore — this names the role (a link to the code), not a specific platform's mark.
  sourceCode: Code2,
  chevron: ChevronDown,
  sun: Sun,
  moon: Moon,
  list: List,
  export: Share2
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
