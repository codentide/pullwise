import { normalizeName, sets } from './gameData.ts'
import type { Card, Knowledge } from './types.ts'

export interface Filters {
  text: string
  set: string
  rarity: string
  element: string
  kind: '' | 'pokemon' | 'trainer'
  /** Only cards you have already formed an opinion about. */
  onlyKnown: boolean
}

export const emptyFilters: Filters = {
  text: '',
  set: '',
  rarity: '',
  element: '',
  kind: '',
  onlyKnown: false,
}

/** Sets by release, newest first: that is what gets searched most. */
export const setsNewestFirst = [...sets].sort((a, b) =>
  b.releaseDate.localeCompare(a.releaseDate)
)

export const RARITIES = ['C', 'U', 'R', 'RR', 'AR', 'SR', 'SAR', 'IM', 'S', 'SSR', 'UR']

export const ELEMENTS = [
  'grass',
  'fire',
  'water',
  'lightning',
  'psychic',
  'fighting',
  'darkness',
  'metal',
  'dragon',
  'colorless',
]

const isTrainer = (card: Card) =>
  card.type !== undefined && card.type !== 'pokemon'

export function filterCards (cards: Card[], filters: Filters, knowledge: Knowledge): Card[] {
  const needle = filters.text.trim() ? normalizeName(filters.text) : ''

  return cards.filter((card) => {
    if (filters.set && card.set !== filters.set) return false
    if (filters.rarity && card.rarity !== filters.rarity) return false
    if (filters.element && card.element !== filters.element) return false
    if (filters.kind === 'pokemon' && card.type !== 'pokemon') return false
    if (filters.kind === 'trainer' && !isTrainer(card)) return false
    if (filters.onlyKnown && knowledge[card.id] === undefined) return false
    if (needle && !normalizeName(card.name).includes(needle)) return false
    return true
  })
}
