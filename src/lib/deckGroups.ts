/** Groups a deck the way players think about one — basics first, then their evolutions, then trainers; the ~700 cards the dataset has no metadata for (all 2026 sets) land in their own group rather than being guessed at, and it empties itself when upstream catches up. */
import { cards as allCards, cardsByName, normalizeName } from './gameData.ts'
import { deckCards } from './deckRules.ts'
import type { Card, Deck } from './types.ts'

export type GroupId = 'basic' | 'evolution' | 'trainer' | 'unclassified'

export const GROUP_ORDER: GroupId[] = ['basic', 'evolution', 'trainer', 'unclassified']

export interface DeckGroup {
  id: GroupId
  entries: Array<{ card: Card, copies: number }>
  /** Copies, not distinct cards: what the player counts towards 20. */
  count: number
}

function groupOf (card: Card): GroupId {
  if (card.type === undefined) return 'unclassified'
  if (card.type !== 'pokemon') return 'trainer'
  return card.stage === 'basic' ? 'basic' : 'evolution'
}

export function groupDeck (deck: Deck): DeckGroup[] {
  const buckets = new Map<GroupId, DeckGroup>(
    GROUP_ORDER.map((id) => [id, { id, entries: [], count: 0 }])
  )

  for (const entry of deckCards(deck)) {
    const group = buckets.get(groupOf(entry.card))!
    group.entries.push(entry)
    group.count += entry.copies
  }

  // Within a group, evolutions read best next to their line.
  for (const group of buckets.values()) {
    group.entries.sort((a, b) =>
      (a.card.evolvesFrom ?? a.card.name).localeCompare(b.card.evolvesFrom ?? b.card.name) ||
      a.card.name.localeCompare(b.card.name)
    )
  }

  return GROUP_ORDER.map((id) => buckets.get(id)!).filter((group) => group.entries.length > 0)
}

/** One link in an evolution chain: either a card in the deck, or a hole. */
export interface ChainLink {
  name: string
  /** The printing in the deck, when there is one. */
  inDeck?: Card
  /** Printings that would fill it, cheapest first. Only on a hole. */
  candidates?: Card[]
}

export interface LineGap {
  /** The evolution that is stranded. */
  needs: Card
  /** The missing pre-evolution's name. */
  missingName: string
  /** Printings of it that could fill the gap, cheapest rarity first. */
  candidates: Card[]
  /** The whole line, holes included, basic first. */
  chain: ChainLink[]
}

const RARITY_COST = ['C', 'U', 'R', 'RR', 'AR', 'SR', 'SAR', 'IM', 'S', 'SSR', 'UR']

/** Evolutions in the deck whose pre-evolution is absent, with printings that would fill the gap — turns what the validator already flags into a one-click fix instead of a warning to act on. */
export function lineGaps (deck: Deck): LineGap[] {
  const entries = deckCards(deck)
  const present = new Set(entries.map(({ card }) => card.name))
  const gaps: LineGap[] = []
  const seen = new Set<string>()

  for (const { card } of entries) {
    const from = card.evolvesFrom
    if (from === undefined || present.has(from) || seen.has(from)) continue
    seen.add(from)

    const candidates = (cardsByName.get(normalizeName(from)) ?? [])
      .slice()
      .sort((a, b) => RARITY_COST.indexOf(a.rarity) - RARITY_COST.indexOf(b.rarity))
      .slice(0, 3)

    gaps.push({ needs: card, missingName: from, candidates, chain: chainFor(card, entries) })
  }

  return gaps
}

/** The evolution chain behind a card, from the basic upward, marking which links the deck has and which are holes — a row of cards reads a gap at a glance, where a sentence would have to explain it. */
function chainFor (card: Card, entries: Array<{ card: Card }>): ChainLink[] {
  const byName = new Map(entries.map((entry) => [entry.card.name, entry.card]))
  const chain: ChainLink[] = []
  const seen = new Set<string>()

  // Walks down from the card towards the basic; each name becomes exactly one link, whether the deck has it or not.
  let name: string | undefined = card.name
  while (name !== undefined && !seen.has(name)) {
    seen.add(name)

    const owned = byName.get(name)
    const options: Card[] = owned != null
      ? []
      : (cardsByName.get(normalizeName(name)) ?? [])
          .slice()
          .sort((a, b) => RARITY_COST.indexOf(a.rarity) - RARITY_COST.indexOf(b.rarity))
          .slice(0, 3)

    chain.unshift(owned != null ? { name, inDeck: owned } : { name, candidates: options })
    name = (owned ?? options[0])?.evolvesFrom
  }

  return chain
}

/** First matches for a query, ranked so the obvious card comes first. */
export function quickSearch (query: string, limit = 24): Card[] {
  const needle = normalizeName(query)
  if (needle === '') return []

  const starts: Card[] = []
  const contains: Card[] = []
  for (const card of allCards) {
    const name = normalizeName(card.name)
    if (name.startsWith(needle)) starts.push(card)
    else if (name.includes(needle)) contains.push(card)
    if (starts.length >= limit * 2) break
  }

  // An exact prefix beats a substring, and a cheaper printing beats a rare one: the player almost always means the version they can actually get.
  const rank = (card: Card): number => RARITY_COST.indexOf(card.rarity)
  return [...starts.sort((a, b) => rank(a) - rank(b)), ...contains].slice(0, limit)
}
