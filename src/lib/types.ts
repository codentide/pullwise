export type CardId = string

export interface Card {
  id: CardId
  set: string
  number: number
  name: string
  rarity: string
  /** Packs within the set that can yield this card. Empty = not from packs. */
  packs: string[]
  type?: 'pokemon' | 'supporter' | 'item' | 'tool' | 'Fossil'
  element?: string
  /** 'basic' | '1' | '2'. Absent when the dataset does not carry it. */
  stage?: string
  evolvesFrom?: string
  weakness?: string
  /** Metadata was copied from another card with the same name, not sourced. */
  inferred?: boolean
  /** The game's own internal id, needed for a deck-share code; optional even though today's sync covers every card, since it's derived from a filename field upstream could reshape (same posture as `stage`/`element`). */
  deckBuilderNr?: number
}

export interface CardSet {
  code: string
  series: string
  name: string
  releaseDate: string
  packs: string[]
  obtainableFromPacks: boolean
}

/** One pack variant within a set: the common one and the 0.05% rare pack. */
export interface PackVariant {
  appearance_rate: number
  cards: number
  /** slot -> rarity -> probability, as a percentage. */
  slots: Record<string, Record<string, number>>
}

export type PullRates = Record<string, Record<string, PackVariant>>
/** set -> pack -> rarity -> how many distinct cards of that rarity it can yield. */
export type PoolCounts = Record<string, Record<string, Record<string, number>>>

/** A concrete pack you can open in the game. */
export interface PackRef {
  set: string
  pack: string
}

/** A card you are missing, and how many copies of it. */
export interface MissingCard {
  card: Card
  needed: number
}

export interface DeckEntry {
  cardId: CardId
  /** Copies the deck asks for: 1 or 2. */
  copies: number
}

export interface Deck {
  id: string
  name: string
  entries: DeckEntry[]
  /** The energy zone's types; `undefined` means nobody has chosen — same "explicit beats inferred" rule as `Knowledge`, a guess is shown but nothing is written until the player picks one or a decklist names one. */
  energy?: string[]
  updatedAt: number
}

/** Copies you own of each card, global not per deck — a missing key means UNKNOWN, not the same as zero. */
export type Knowledge = Record<CardId, number>
