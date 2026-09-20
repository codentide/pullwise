/**
 * Parser for decklists pasted as text.
 *
 * What Limitless exports is one line per card — `2 Pikachu ex A1 096` — with
 * section headers in between. It is not documented as a stable format, so the
 * parser is deliberately forgiving: it tries set+number, then exact name, and
 * reports whatever it could not resolve instead of failing.
 */
import { cardsById, cardsByName, normalizeName, sets } from './gameData.ts'
import type { Card, DeckEntry } from './types.ts'

/** Lists and the CDN use different promo codes than the dataset. */
const SET_ALIASES: Record<string, string> = { 'P-A': 'PROMO-A', 'P-B': 'PROMO-B' }

/**
 * 13 of the 23 sets carry a lowercase suffix in their real code — `B1a`, `A2b` —
 * and a pasted list arrives in whatever case someone typed it. Blindly
 * uppercasing the input, as this used to do, turns `B1a` into `B1A`, which
 * matches nothing: the lookup silently fell through to the name-based fallback
 * and resolved to a different printing with different packs, which sent the
 * pack recommendation wrong without anyone seeing an error.
 */
const SET_CODES_BY_UPPER = new Map(sets.map((set) => [set.code.toUpperCase(), set.code]))

function resolveSetCode (raw: string): string {
  const upper = raw.toUpperCase()
  return SET_ALIASES[upper] ?? SET_CODES_BY_UPPER.get(upper) ?? upper
}

export interface ParsedDeck {
  entries: DeckEntry[]
  /** Lines that looked like a card but could not be resolved. */
  unresolved: string[]
}

/** `2 Pikachu ex A1 096` -> copies, name, set, number. Set and number optional. */
const CARD_LINE = /^(\d+)\s*x?\s+(.+?)(?:\s+([A-Za-z]+[\w-]*)\s+(\d+))?$/

/** Section headers and totals that are not cards. */
const SKIP_LINE = /^(pok[eé]mon|trainer|supporter|item|tool|energy|total)\b.*:?\s*\d*$/i

function findCard (name: string, setCode?: string, number?: string): Card | undefined {
  if (setCode && number) {
    const set = resolveSetCode(setCode)
    const exact = cardsById.get(`${set}-${number.padStart(3, '0')}`)
    if (exact) return exact
  }

  const candidates = cardsByName.get(normalizeName(name))
  if (!candidates || candidates.length === 0) return undefined

  // With no explicit set, the cheapest printing is the best guess: it is almost
  // always the one the player owns or will go after.
  const rarityOrder = ['C', 'U', 'R', 'RR', 'AR', 'SR', 'SAR', 'IM', 'S', 'SSR', 'UR']
  return [...candidates].sort(
    (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
  )[0]
}

export function parseDecklist (text: string): ParsedDeck {
  const byCard = new Map<string, number>()
  const unresolved: string[] = []

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || SKIP_LINE.test(line)) continue

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
  return { entries, unresolved }
}
