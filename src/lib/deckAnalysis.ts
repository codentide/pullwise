/**
 * Joins the deck, what you know about your collection, and the pack maths.
 * Used alike by the deck editor and the pack screen.
 */
import { allPacks, packMath, simulator } from './gameData.ts'
import { mulberry32, seedFor } from './simulate.ts'
import { deckCards } from './deckRules.ts'
import { missingCopies } from './store.ts'
import type { PackRanking } from './packMath.ts'
import type { SimulationResult } from './simulate.ts'
import type { Card, Deck, Knowledge, MissingCard } from './types.ts'

export interface DeckAnalysis {
  /** Missing cards some pack can yield. */
  missing: MissingCard[]
  /** Missing cards no pack yields (promos and mission cards). */
  unobtainable: MissingCard[]
  ranking: PackRanking[]
  simulation: SimulationResult | null
}

/** Missing copies of each deck card. Unknown is assumed to be owned. */
export function missingFor (deck: Deck, knowledge: Knowledge): MissingCard[] {
  return deckCards(deck).flatMap(({ card, copies }) => {
    const needed = missingCopies(knowledge, card.id, copies)
    return needed > 0 ? [{ card, needed }] : []
  })
}

export function analyzeDeck (deck: Deck, knowledge: Knowledge): DeckAnalysis {
  return analyzeMissing(missingFor(deck, knowledge))
}

export function analyzeMissing (all: MissingCard[]): DeckAnalysis {
  const comesFromPack = (m: MissingCard) =>
    allPacks.some((pack) => packMath.isInPack(m.card, pack))

  const missing = all.filter(comesFromPack)
  const unobtainable = all.filter((m) => !comesFromPack(m))

  if (missing.length === 0) {
    return { missing, unobtainable, ranking: [], simulation: null }
  }

  return {
    missing,
    unobtainable,
    ranking: packMath.rankPacks(missing, allPacks),
    // The simulation is seeded with a hash of what is missing: without it the
    // median drifted by several packs between reloads of the same deck, and a
    // number that wobbles on its own cannot be trusted. Still an estimate, but a
    // stable one. 400 runs take tens of milliseconds, so no worker is needed.
    simulation: simulator.simulatePacksToComplete(missing, allPacks, {
      trials: 400,
      random: mulberry32(seedFor(missing)),
    }),
  }
}

/** Pools what is missing across every deck, keeping the largest need per card. */
export function missingAcrossDecks (decks: Deck[], knowledge: Knowledge): MissingCard[] {
  const worst = new Map<string, MissingCard>()
  for (const deck of decks) {
    for (const entry of missingFor(deck, knowledge)) {
      const current = worst.get(entry.card.id)
      if (!current || entry.needed > current.needed) worst.set(entry.card.id, entry)
    }
  }
  return [...worst.values()]
}

/**
 * Where a card comes from and what it costs, pack by pack.
 *
 * A single card needs no simulation: the number of packs until the first hit is
 * geometric, so the mean is exactly 1/p. That is what makes this computable at
 * build time for all 3,879 cards.
 */
export function cardOdds (card: Card) {
  return allPacks
    .filter((pack) => packMath.isInPack(card, pack))
    .map((pack) => {
      const [ranked] = packMath.rankPacks([{ card, needed: 1 }], [pack])
      const chance = ranked?.chanceOfUseful ?? 0
      return {
        pack,
        chance,
        expectedPacks: chance > 0 ? Math.round(1 / chance) : null,
        estimated: packMath.usesEstimatedRates(pack.set),
      }
    })
    .sort((a, b) => b.chance - a.chance)
}
