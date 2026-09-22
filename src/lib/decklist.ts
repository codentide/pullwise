/** Parser for decklists pasted as text (`2 Pikachu ex A1 096` per line, Limitless-style); the format isn't documented as stable, so it's deliberately forgiving — set+number, then exact name, then reports whatever it couldn't resolve instead of failing. */
import { cardsById, cardsByName, normalizeName, sets } from './gameData.ts'
import { ELEMENTS } from './filters.ts'
import { MAX_ENERGY_TYPES, resolvedEnergy } from './energy.ts'
import { deckCards } from './deckRules.ts'
import type { Card, Deck, DeckEntry } from './types.ts'

/** Lists and the CDN use different promo codes than the dataset. */
const SET_ALIASES: Record<string, string> = { 'P-A': 'PROMO-A', 'P-B': 'PROMO-B' }

/** 13 of 23 sets have a lowercase suffix (`B1a`, `A2b`); blindly uppercasing the input, as this used to, turned `B1a` into `B1A`, which matched nothing and silently fell through to a wrong printing with a wrong pack recommendation. */
const SET_CODES_BY_UPPER = new Map(sets.map((set) => [set.code.toUpperCase(), set.code]))

function resolveSetCode (raw: string): string {
  const upper = raw.toUpperCase()
  return SET_ALIASES[upper] ?? SET_CODES_BY_UPPER.get(upper) ?? upper
}

export interface ParsedDeck {
  entries: DeckEntry[]
  /** Lines that looked like a card but could not be resolved. */
  unresolved: string[]
  /** The energy zone, when the list named one — absent, never empty. */
  energy?: string[]
}

/** `2 Pikachu ex A1 096` -> copies, name, set, number. Set and number optional. */
const CARD_LINE = /^(\d+)\s*x?\s+(.+?)(?:\s+([A-Za-z]+[\w-]*)\s+(\d+))?$/

/** Section headers and totals that are not cards. */
const SKIP_LINE = /^(pok[eé]mon|trainer|supporter|item|tool|energy|total)\b.*:?\s*\d*$/i

/** "Energy: Lightning" names the deck's own energy zone; it used to fall into SKIP_LINE and get discarded — the only piece of a decklist this parser threw away instead of resolving or reporting. */
const ENERGY_LINE = /^energy\s*:?\s*(.*)$/i

/** Words on an energy line, matched against the elements the game actually has. */
function parseEnergyWords (text: string): string[] {
  const known = new Set(ELEMENTS)
  const found: string[] = []
  for (const word of text.split(/[,/+]|\band\b|\s+/i)) {
    if (found.length >= MAX_ENERGY_TYPES) break
    const token = normalizeName(word)
    if (known.has(token) && !found.includes(token)) found.push(token)
  }
  return found
}

function findCard (name: string, setCode?: string, number?: string): Card | undefined {
  if (setCode && number) {
    const set = resolveSetCode(setCode)
    const exact = cardsById.get(`${set}-${number.padStart(3, '0')}`)
    if (exact) return exact
  }

  const candidates = cardsByName.get(normalizeName(name))
  if (!candidates || candidates.length === 0) return undefined

  // With no explicit set, the cheapest printing is the best guess: it is almost always the one the player owns or will go after.
  const rarityOrder = ['C', 'U', 'R', 'RR', 'AR', 'SR', 'SAR', 'IM', 'S', 'SSR', 'UR']
  return [...candidates].sort(
    (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
  )[0]
}

export function parseDecklist (text: string): ParsedDeck {
  const byCard = new Map<string, number>()
  const unresolved: string[] = []
  let energy: string[] | undefined

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    // Checked before SKIP_LINE, which would otherwise swallow this line too — it also starts with "energy".
    const energyMatch = ENERGY_LINE.exec(line)
    if (energyMatch) {
      const words = parseEnergyWords(energyMatch[1] ?? '')
      if (words.length > 0) energy = words
      continue
    }

    if (SKIP_LINE.test(line)) continue

    const match = CARD_LINE.exec(line)
    if (!match) {
      unresolved.push(line)
      continue
    }

    const [, countRaw, name, setCode, number] = match
    const card = findCard(name!.trim(), setCode, number)
    if (!card) {
      unresolved.push(line)
      continue
    }

    const count = Number(countRaw)
    byCard.set(card.id, (byCard.get(card.id) ?? 0) + count)
  }

  const entries = [...byCard].map(([cardId, copies]) => ({ cardId, copies }))
  return { entries, unresolved, energy }
}

const isTrainerCard = (card: Card): boolean =>
  card.type !== undefined && card.type !== 'pokemon'

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)

/** The inverse of `parseDecklist`, so a deck round-trips through Limitless or anywhere else that reads that plain-text format — not just the game's own QR import. */
export function toDecklist (deck: Deck): string {
  const entries = deckCards(deck)
  const pokemon = entries.filter(({ card }) => !isTrainerCard(card))
  const trainers = entries.filter(({ card }) => isTrainerCard(card))

  const line = ({ card, copies }: { card: Card, copies: number }): string =>
    `${copies} ${card.name} ${card.set} ${String(card.number).padStart(3, '0')}`

  const total = (group: typeof entries): number => group.reduce((sum, e) => sum + e.copies, 0)

  const sections: string[] = []
  if (pokemon.length > 0) sections.push(`Pokémon: ${total(pokemon)}`, ...pokemon.map(line))
  if (trainers.length > 0) sections.push(`Trainer: ${total(trainers)}`, ...trainers.map(line))

  const { energy } = resolvedEnergy(deck)
  if (energy.length > 0) sections.push(`Energy: ${energy.map(capitalize).join(', ')}`)

  return sections.join('\n')
}
