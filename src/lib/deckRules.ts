/** Deck construction rules: exactly 20 cards, at most 2 per name (printings of the same Pokémon compete for one slot); issues are codes with parameters, not sentences, since this module must not know the interface's language; evolution checking is best-effort because ~700 newest-set cards have no metadata, and staying quiet beats accusing a legal deck. */
import { cardsById } from './gameData.ts'
import type { Card, Deck } from './types.ts'

export const DECK_SIZE = 20
export const MAX_COPIES_PER_NAME = 2

export type IssueLevel = 'error' | 'warning' | 'info'

export type DeckIssue =
  | { level: 'error', code: 'tooFewCards', count: number, size: number }
  | { level: 'error', code: 'tooManyCards', count: number, size: number }
  | { level: 'error', code: 'tooManyCopies', name: string, copies: number, max: number }
  | { level: 'error', code: 'noBasic' }
  | { level: 'warning', code: 'evolutionWithoutBase', name: string, from: string }
  | { level: 'info', code: 'unknownMetadata', count: number }

/** The deck's cards, resolved, with their copy counts. */
export function deckCards (deck: Deck): Array<{ card: Card, copies: number }> {
  return deck.entries.flatMap((entry) => {
    const card = cardsById.get(entry.cardId)
    return card != null ? [{ card, copies: entry.copies }] : []
  })
}

export const deckSize = (deck: Deck): number =>
  deck.entries.reduce((total, entry) => total + entry.copies, 0)

export function validateDeck (deck: Deck): DeckIssue[] {
  const issues: DeckIssue[] = []
  const entries = deckCards(deck)
  const total = deckSize(deck)

  if (total < DECK_SIZE) {
    issues.push({ level: 'error', code: 'tooFewCards', count: DECK_SIZE - total, size: DECK_SIZE })
  } else if (total > DECK_SIZE) {
    issues.push({ level: 'error', code: 'tooManyCards', count: total - DECK_SIZE, size: DECK_SIZE })
  }

  // The copy cap is per name, so printings have to be added up together.
  const copiesByName = new Map<string, number>()
  for (const { card, copies } of entries) {
    copiesByName.set(card.name, (copiesByName.get(card.name) ?? 0) + copies)
  }
  for (const [name, copies] of copiesByName) {
    if (copies > MAX_COPIES_PER_NAME) {
      issues.push({ level: 'error', code: 'tooManyCopies', name, copies, max: MAX_COPIES_PER_NAME })
    }
  }

  const anyStageKnown = entries.some(({ card }) => card.stage !== undefined)
  if (anyStageKnown && !entries.some(({ card }) => card.stage === 'basic')) {
    issues.push({ level: 'error', code: 'noBasic' })
  }

  // Evolutions without their line. Only what the dataset actually knows.
  const present = new Set(entries.map(({ card }) => card.name))
  for (const { card } of entries) {
    if (card.evolvesFrom !== undefined && !present.has(card.evolvesFrom)) {
      issues.push({
        level: 'warning',
        code: 'evolutionWithoutBase',
        name: card.name,
        from: card.evolvesFrom
      })
    }
  }

  const unknown = entries.filter(({ card }) => card.type === undefined).length
  if (unknown > 0) {
    issues.push({ level: 'info', code: 'unknownMetadata', count: unknown })
  }

  return issues
}
