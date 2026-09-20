/**
 * Persistent state: the decks and what you know about your collection.
 *
 * All of it lives in localStorage. `knowledge` is global rather than per deck on
 * purpose: mark a Pikachu ex as missing and every deck using it already knows.
 * That is what makes the collection grow on its own as decks get built, without
 * the app ever asking anyone to log 3,879 cards.
 *
 * A key absent from `knowledge` means UNKNOWN, which is not zero. That
 * distinction is the foundation of the product: never confuse "I do not have it"
 * with "I do not know".
 */
import type { Deck, DeckEntry, Knowledge } from './types.ts'

const STORAGE_KEY = 'pullwise:v1'

export interface State {
  version: 1
  decks: Deck[]
  knowledge: Knowledge
}

export const emptyState = (): State => ({ version: 1, decks: [], knowledge: {} })

function load (): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as Partial<State>
    if (parsed.version !== 1 || !Array.isArray(parsed.decks)) return emptyState()
    return { version: 1, decks: parsed.decks, knowledge: parsed.knowledge ?? {} }
  } catch {
    // localStorage may be disabled or the contents corrupt; starting empty
    // beats breaking the app.
    return emptyState()
  }
}

let state: State = typeof localStorage === 'undefined' ? emptyState() : load()
const listeners = new Set<() => void>()

function commit (next: State) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Out of quota or private mode: carry on in memory.
  }
  for (const listener of listeners) listener()
}

/** Subscription surface for React's useSyncExternalStore, which lives in the UI. */
export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export const getState = (): State => state

// Two tabs in the same browser share localStorage but not memory: without this,
// marking a card in one leaves the other showing stale data, and the last writer
// silently clobbers the other.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return
    state = load()
    for (const listener of listeners) listener()
  })
}

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random())

const touch = (deck: Deck): Deck => ({ ...deck, updatedAt: Date.now() })

const replaceDeck = (decks: Deck[], id: string, update: (deck: Deck) => Deck) =>
  decks.map((deck) => (deck.id === id ? touch(update(deck)) : deck))

export const actions = {
  createDeck (name = 'Mazo nuevo', entries: DeckEntry[] = [], energy?: string[]): string {
    const deck: Deck = { id: newId(), name, entries, energy, updatedAt: Date.now() }
    commit({ ...state, decks: [deck, ...state.decks] })
    return deck.id
  },

  renameDeck (id: string, name: string) {
    commit({ ...state, decks: replaceDeck(state.decks, id, (deck) => ({ ...deck, name })) })
  },

  /** `undefined` puts the energy zone back to inferred rather than clearing it. */
  setEnergy (id: string, energy: string[] | undefined) {
    commit({ ...state, decks: replaceDeck(state.decks, id, (deck) => ({ ...deck, energy })) })
  },

  deleteDeck (id: string) {
    commit({ ...state, decks: state.decks.filter((deck) => deck.id !== id) })
  },

  /**
   * Adds or removes copies of a card. On first add the card is assumed owned:
   * you build with what you have, and what is missing is the exception you mark
   * by hand.
   */
  setCopies (deckId: string, cardId: string, copies: number) {
    const clamped = Math.max(0, Math.min(2, copies))
    const isNew = !state.decks
      .find((deck) => deck.id === deckId)
      ?.entries.some((entry) => entry.cardId === cardId)

    const decks = replaceDeck(state.decks, deckId, (deck) => {
      const entries = deck.entries.filter((entry) => entry.cardId !== cardId)
      if (clamped > 0) entries.push({ cardId, copies: clamped })
      return { ...deck, entries }
    })

    const knowledge = { ...state.knowledge }
    if (isNew && clamped > 0 && knowledge[cardId] === undefined) knowledge[cardId] = clamped

    commit({ ...state, decks, knowledge })
  },

  /** How many copies you own. `undefined` makes the card unknown again. */
  setOwned (cardId: string, owned: number | undefined) {
    const knowledge = { ...state.knowledge }
    if (owned === undefined) delete knowledge[cardId]
    else knowledge[cardId] = Math.max(0, Math.min(2, owned))
    commit({ ...state, knowledge })
  },

  addEntries (deckId: string, entries: DeckEntry[]) {
    const decks = replaceDeck(state.decks, deckId, (deck) => {
      const merged = new Map(deck.entries.map((entry) => [entry.cardId, entry.copies]))
      for (const entry of entries) merged.set(entry.cardId, entry.copies)
      return {
        ...deck,
        entries: [...merged].map(([cardId, copies]) => ({ cardId, copies })),
      }
    })

    // Imported cards are assumed owned, same as adding by hand.
    const knowledge = { ...state.knowledge }
    for (const entry of entries) {
      if (knowledge[entry.cardId] === undefined) knowledge[entry.cardId] = entry.copies
    }

    commit({ ...state, decks, knowledge })
  },

  exportJson: () => JSON.stringify(state, null, 2),

  importJson (raw: string): boolean {
    try {
      const parsed = JSON.parse(raw) as Partial<State>
      if (parsed.version !== 1 || !Array.isArray(parsed.decks)) return false
      commit({ version: 1, decks: parsed.decks, knowledge: parsed.knowledge ?? {} })
      return true
    } catch {
      return false
    }
  },

  reset () {
    commit(emptyState())
  },
}

/** Missing copies of a card for a deck. Unknown is assumed owned. */
export function missingCopies (knowledge: Knowledge, cardId: string, needed: number): number {
  const owned = knowledge[cardId]
  return Math.max(0, needed - (owned ?? needed))
}
