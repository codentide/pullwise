/** The energy zone: explicit beats inferred (same rule `Knowledge` lives by) — an untouched deck shows the maths' best guess until the player sets one directly or a pasted decklist names one, same as marking a card ends "unknown" for it. */
import { deckCards } from './deckRules.ts'
import type { Deck } from './types.ts'

/** The game's Energy Zone never holds more than 3 types, full stop. */
export const MAX_ENERGY_TYPES = 3

/** Elements present among the deck's own Pokémon, most common first; the 511 cards with no `element` yet are excluded rather than guessed at — worse to infer from cards it knows nothing about than from fewer it's sure of. */
export function inferEnergy (deck: Deck): string[] {
  const counts = new Map<string, number>()
  for (const { card } of deckCards(deck)) {
    if (card.element === undefined) continue
    counts.set(card.element, (counts.get(card.element) ?? 0) + 1)
  }
  // Capped at 3 because a real Energy Zone can never hold more, so a deck spanning four-plus types infers only its three biggest.
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

/** The ten TCG energy symbols. Lives here rather than a component so it can be reused by both client and server code without crossing the RSC boundary. */
export type Energy =
  | 'grass' | 'fire' | 'water' | 'lightning' | 'psychic'
  | 'fighting' | 'darkness' | 'metal' | 'dragon' | 'colorless'

const ENERGIES: readonly Energy[] = [
  'grass', 'fire', 'water', 'lightning', 'psychic',
  'fighting', 'darkness', 'metal', 'dragon', 'colorless'
]

export const isEnergy = (value: string): value is Energy => (ENERGIES as string[]).includes(value)

/** `card.weakness` is a capitalised game string (`'Fire'`, `'Dark'`) that doesn't match the `Energy` keys directly — normalises it to one, or `null` if it's not a recognised energy. */
export const weaknessEnergy = (weakness: string): Energy | null => {
  const key = weakness.toLowerCase() === 'dark' ? 'darkness' : weakness.toLowerCase()
  return isEnergy(key) ? key : null
}
