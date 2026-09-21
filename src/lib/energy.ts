/**
 * The energy zone: which types the game generates for you to attach.
 *
 * Explicit beats inferred, the same rule `Knowledge` already lives by. A deck
 * nobody has set an energy zone for is not "missing" one — it shows what the
 * maths would pick, from the deck's own Pokémon, and that guess stays live
 * until the player actually touches it or a pasted decklist names one
 * outright. Touching it once ends the guessing for good, same as marking a
 * single copy of a card ends "unknown" for that card.
 */
import { deckCards } from './deckRules.ts'
import type { Deck } from './types.ts'

/** The game's Energy Zone never holds more than 3 types, full stop. */
export const MAX_ENERGY_TYPES = 3

/**
 * Elements present among the deck's own Pokémon, most common first.
 *
 * Cards with no `element` — the 511 the dataset has no type for yet — are
 * silently excluded rather than guessed at: an inference built partly on
 * cards it knows nothing about would be worse than one built on fewer cards
 * it is sure of.
 */
export function inferEnergy (deck: Deck): string[] {
  const counts = new Map<string, number>()
  for (const { card } of deckCards(deck)) {
    if (card.element === undefined) continue
    counts.set(card.element, (counts.get(card.element) ?? 0) + 1)
  }
  // Most-represented elements first, capped at 3 — a real Energy Zone can
  // never hold more, so a deck spanning four or more types infers only its
  // three biggest instead of a guess the game could not actually hold.
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_ENERGY_TYPES)
    .map(([element]) => element)
}

export interface ResolvedEnergy {
  energy: string[]
  /** True when this is the guess, not something the player chose. */
  inferred: boolean
}

/** What actually applies: the deck's own choice, or the inference behind it. */
export function resolvedEnergy (deck: Deck): ResolvedEnergy {
  return deck.energy !== undefined
    ? { energy: deck.energy, inferred: false }
    : { energy: inferEnergy(deck), inferred: true }
}
