/** The in-game deck-share code, built with `ptcgp-deckcode` (MIT) from each card's `deckBuilderNr`; ownership is irrelevant (the code is what the deck *is*, not what you own — missing cards just become an in-game shopping list on import) and so is deck size (no floor beyond having something to encode). */
import { ENERGY, createDeckCode } from 'ptcgp-deckcode'
import { deckCards, deckSize } from './deckRules.ts'
import { MAX_ENERGY_TYPES, resolvedEnergy } from './energy.ts'
import type { Deck } from './types.ts'

export type DeckCodeResult =
  | { ok: true, code: string, energy: string[] }
  | { ok: false, reason: 'empty' }
  | { ok: false, reason: 'noEnergy' }

export function buildDeckCode (deck: Deck): DeckCodeResult {
  if (deckSize(deck) === 0) return { ok: false, reason: 'empty' }

  // The Energy Zone never offers dragon or colorless, so a deck resolved to one of those encodes as "no energy" instead of silently keeping whatever else is present.
  const { energy } = resolvedEnergy(deck)
  // Capped again here because the encoder throws on a fourth type, and throwing inside a render path is worse than silently keeping the three most useful ones.
  const encodable = energy
    .filter((e): e is keyof typeof ENERGY => e in ENERGY)
    .slice(0, MAX_ENERGY_TYPES)
  if (encodable.length === 0) return { ok: false, reason: 'noEnergy' }

  // One entry per copy, not per card: the format has no separate count field.
  const nrs = deckCards(deck).flatMap(({ card, copies }) => {
    // `deckBuilderNr` is optional in the type, but every synced card has one today (verified 3,879/3,879); failing loudly here beats silently producing a code that scans into the wrong deck.
    if (card.deckBuilderNr === undefined) {
      throw new Error(`${card.name} (${card.id}) has no deckBuilderNr`)
    }
    return Array<number>(copies).fill(card.deckBuilderNr)
  })

  return { ok: true, code: createDeckCode(nrs, encodable), energy: encodable }
}
