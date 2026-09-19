/**
 * The single place where the static dataset becomes queryable.
 * Everything here is computed once, when the module loads.
 */
import { createPackMath } from './packMath.ts'
import { createSimulator } from './simulate.ts'
import type { Card, CardSet, PackRef, PoolCounts, PullRates } from './types.ts'

import cardsJson from '../data/cards.json' with { type: 'json' }
import setsJson from '../data/sets.json' with { type: 'json' }
import pullRatesJson from '../data/pullRates.json' with { type: 'json' }
import poolCountsJson from '../data/poolCounts.json' with { type: 'json' }
import rateFallbacksJson from '../data/rateFallbacks.json' with { type: 'json' }
import metaJson from '../data/meta.json' with { type: 'json' }

export const cards = cardsJson as Card[]
export const sets = setsJson as CardSet[]
export const meta = metaJson as {
  generatedAt: string
  cardCount: number
  latestSet: string
}

export const packMath = createPackMath({
  pullRates: pullRatesJson as PullRates,
  poolCounts: poolCountsJson as PoolCounts,
  rateFallbacks: rateFallbacksJson as Record<string, string>
})
export const simulator = createSimulator(packMath)

export const cardsById = new Map(cards.map((card) => [card.id, card]))
export const setsByCode = new Map(sets.map((set) => [set.code, set]))

/** Every openable pack in the game, newest release first. */
export const allPacks: PackRef[] = [...sets]
  .filter((set) => set.obtainableFromPacks)
  .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
  .flatMap((set) => set.packs.map((pack) => ({ set: set.code, pack })))

/**
 * Cards by normalised name, for the decklist parser. The whole list is kept
 * because the same Pokémon appears across sets and printings need disambiguating.
 */
export const cardsByName = new Map<string, Card[]>()
for (const card of cards) {
  const key = normalizeName(card.name)
  const list = cardsByName.get(key)
  if (list != null) list.push(card)
  else cardsByName.set(key, [card])
}

export function normalizeName (name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/** The CDN names a few sets differently from the dataset. */
const IMAGE_SET_CODES: Record<string, string> = { 'PROMO-A': 'P-A', 'PROMO-B': 'P-B' }

/**
 * Card art. Only English exists today with full coverage.
 *
 * TCGdex does publish Spanish art, but only for 11 of the 23 sets — and the gaps
 * are every 2026 set (B1 onwards), which is exactly what people are playing. A
 * deck would come out half in each language, so the locale is accepted and
 * ignored until coverage catches up: then this becomes a data change, not a code
 * change.
 */
export function imageUrl (card: Card, _locale?: string): string {
  const set = IMAGE_SET_CODES[card.set] ?? card.set
  const number = String(card.number).padStart(3, '0')
  return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/pocket/${set}/${set}_${number}_EN.webp`
}

export const setName = (code: string): string => setsByCode.get(code)?.name ?? code

/** Cards a pack can yield, rarest first. */
const RARITY_ORDER = ['UR', 'SSR', 'S', 'IM', 'SAR', 'SR', 'AR', 'RR', 'R', 'U', 'C']

export function cardsInPack (set: string, pack: string): Card[] {
  return cards
    .filter((card) => card.set === set && card.packs.includes(pack))
    .sort(
      (a, b) =>
        RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
        a.number - b.number
    )
}

/** How many cards of each rarity a pack yields, rarest first. */
export function rarityBreakdown (set: string, pack: string): Array<[string, number]> {
  const counts = new Map<string, number>()
  for (const card of cardsInPack(set, pack)) {
    counts.set(card.rarity, (counts.get(card.rarity) ?? 0) + 1)
  }
  return [...counts].sort(
    (a, b) => RARITY_ORDER.indexOf(a[0]) - RARITY_ORDER.indexOf(b[0])
  )
}
