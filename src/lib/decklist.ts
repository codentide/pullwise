/**
 * Parser for decklists pasted as text.
 *
 * What Limitless exports is one line per card — `2 Pikachu ex A1 096` — with
 * section headers in between. It is not documented as a stable format, so the
 * parser is deliberately forgiving: it tries set+number, then exact name, and
 * reports whatever it could not resolve instead of failing.
 */
import { cardsById, cardsByName, normalizeName } from './gameData.ts'
import type { Card, DeckEntry } from './types.ts'

/** Lists and the CDN use different promo codes than the dataset. */
const SET_ALIASES: Record<string, string> = { 'P-A': 'PROMO-A', 'P-B': 'PROMO-B' }

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
    const set = SET_ALIASES[setCode.toUpperCase()] ?? setCode.toUpperCase()
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
