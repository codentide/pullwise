import test from 'node:test'
import assert from 'node:assert/strict'
import { missingFor, analyzeMissing, analyzeDeck, missingAcrossDecks, cardOdds } from '../src/lib/deckAnalysis.ts'
import { cardsById } from '../src/lib/gameData.ts'
import type { Deck, Knowledge } from '../src/lib/types.ts'

const deck = (entries: Array<[string, number]>): Deck => ({
  id: 'd',
  name: 'test',
  updatedAt: 0,
  entries: entries.map(([cardId, copies]) => ({ cardId, copies })),
})

test('missingFor only reports cards actually short, unknown assumed owned', () => {
  // Pikachu ex: own 1 of 2 needed → short by 1. Erika: unknown, assumed owned.
  const d = deck([['A1-096', 2], ['A1-219', 2]])
  const knowledge: Knowledge = { 'A1-096': 1 }
  const missing = missingFor(d, knowledge)
  assert.equal(missing.length, 1)
  assert.equal(missing[0]!.card.id, 'A1-096')
  assert.equal(missing[0]!.needed, 1)
})

test('analyzeMissing splits pack-obtainable cards from unobtainable ones', () => {
  // Pikachu ex comes from A1's Pikachu pack; Mega Latios ex is a promo, no pack yields it.
  const all = [
    { card: cardsById.get('A1-096')!, needed: 1 },
    { card: cardsById.get('PROMO-B-024')!, needed: 1 },
  ]
  const analysis = analyzeMissing(all)
  assert.deepEqual(analysis.missing.map((m) => m.card.id), ['A1-096'])
  assert.deepEqual(analysis.unobtainable.map((m) => m.card.id), ['PROMO-B-024'])
  assert.ok(analysis.ranking.length > 0)
  assert.ok(analysis.simulation !== null)
})

test('analyzeMissing with nothing missing yields no ranking and no simulation', () => {
  const analysis = analyzeMissing([])
  assert.deepEqual(analysis.missing, [])
  assert.deepEqual(analysis.unobtainable, [])
  assert.deepEqual(analysis.ranking, [])
  assert.equal(analysis.simulation, null)
})

test('analyzeDeck composes missingFor and analyzeMissing for a whole deck', () => {
  const d = deck([['A1-096', 2]])
  const knowledge: Knowledge = { 'A1-096': 0 }
  const analysis = analyzeDeck(d, knowledge)
  assert.equal(analysis.missing.length, 1)
  assert.equal(analysis.missing[0]!.needed, 2)
})

test('missingAcrossDecks keeps the largest need per card across decks', () => {
  const small = deck([['A1-096', 1]])
  const big = deck([['A1-096', 2]])
  const knowledge: Knowledge = { 'A1-096': 0 }
  const worst = missingAcrossDecks([small, big], knowledge)
  assert.equal(worst.length, 1)
  assert.equal(worst[0]!.card.id, 'A1-096')
  assert.equal(worst[0]!.needed, 2)
})

test('cardOdds lists only the packs that actually carry the card', () => {
  const card = cardsById.get('A1-096')! // Pikachu ex, only in A1's Pikachu pack
  const odds = cardOdds(card)
  assert.equal(odds.length, 1)
  const [entry] = odds
  assert.deepEqual(entry!.pack, { set: 'A1', pack: 'Pikachu' })
  assert.ok(entry!.chance > 0 && entry!.chance <= 1)
  assert.equal(entry!.expectedPacks, Math.round(1 / entry!.chance))
})

test('cardOdds sorts the best-odds pack first', () => {
  // Cosmog is common to both Solgaleo's and Lunala's packs; whichever gives it more often should lead.
  const card = cardsById.get('A3-085')!
  const odds = cardOdds(card)
  assert.ok(odds.length >= 2)
  for (let i = 1; i < odds.length; i++) {
    assert.ok(odds[i - 1]!.chance >= odds[i]!.chance)
  }
})
