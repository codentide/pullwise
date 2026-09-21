/**
 * The in-game deck-share code: the thing a player scans to import a deck.
 *
 * The binary format and its encoder are `ptcgp-deckcode` (MIT), which derives
 * each card's internal id the same way `sync-data.mjs` now does — from the
 * CDN filename, `deckBuilderNr`. This module only decides *whether* a deck can
 * be encoded and assembles the flat, repeated-number list the library expects
 * (`[1, 1, 4, 4]` for two pairs) — the format itself is not reimplemented.
 *
 * Card ownership plays no part here on purpose: the code describes what the
 * deck *is*, not what you own. Scanning it into the game with cards missing
 * is confirmed to work — the game turns the gaps into an in-game shopping
 * list, which is the whole reason this exists.
 *
 * Nor does deck *size*: `createDeckCode` has no notion of 20, and neither does
 * this. A deck still being built is still a real, scannable thing — it just
 * imports fewer cards. The only floor is having something to encode at all.
 */
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

  // The game's Energy Zone only ever offers 8 basic types — dragon and
  // colorless are real card elements but never a zone option, because a
  // Dragon-type attack's cost is paid in other basic energies and a
  // Colorless cost accepts any of them. A deck inferred or set to one of
  // those two encodes as "no energy" rather than silently dropping it and
  // encoding whatever else happened to also be present.
  const { energy } = resolvedEnergy(deck)
  // Capped again here, not just at the two places energy gets set: the game's
  // encoder throws on a fourth type, and a thrown error inside a render path
  // is a worse failure than silently keeping the three most useful ones.
  const encodable = energy
    .filter((e): e is keyof typeof ENERGY => e in ENERGY)
    .slice(0, MAX_ENERGY_TYPES)
  if (encodable.length === 0) return { ok: false, reason: 'noEnergy' }

  // One entry per copy, not per card: the format has no separate count field.
  const nrs = deckCards(deck).flatMap(({ card, copies }) => {
    // `deckBuilderNr` is optional in the type — derived from a field upstream
    // could reshape without warning — but every card synced today resolves
    // one (verified: 3,879/3,879). A card that somehow did not would produce
    // a code that scans into the wrong deck, so this fails loudly instead of
    // silently, rather than adding a whole error branch for something that
    // cannot currently happen.
    if (card.deckBuilderNr === undefined) {
      throw new Error(`${card.name} (${card.id}) has no deckBuilderNr`)
    }
    return Array<number>(copies).fill(card.deckBuilderNr)
  })

  return { ok: true, code: createDeckCode(nrs, encodable), energy: encodable }
}
