import test from 'node:test'
import assert from 'node:assert/strict'
import { groupDeck, lineGaps, quickSearch } from '../src/lib/deckGroups.ts'
import type { Deck } from '../src/lib/types.ts'

const deck = (ids: string[]): Deck => ({
  id: 'd',
  name: 'test',
  updatedAt: 0,
  entries: ids.map((cardId) => ({ cardId, copies: 1 })),
})

test('groups a deck the way a player reads one', () => {
  // Bulbasaur (basic) · Ivysaur (stage 1) · Erika (supporter)
  const groups = groupDeck(deck(['A1-001', 'A1-002', 'A1-219']))
  assert.deepEqual(groups.map((g) => g.id), ['basic', 'evolution', 'trainer'])
  assert.equal(groups[0]!.entries[0]!.card.name, 'Bulbasaur')
})

test('counts copies, not distinct cards — that is what adds up to 20', () => {
  const d = deck(['A1-001'])
  d.entries[0]!.copies = 2
  assert.equal(groupDeck(d)[0]!.count, 2)
})

test('cards with no metadata get their own group, never a guess', () => {
  // Shuckle: never printed in an older set, so nothing to infer its type from.
  const groups = groupDeck(deck(['B2-003']))
  assert.equal(groups.length, 1)
  assert.equal(groups[0]!.id, 'unclassified')
})

test('an evolution without its base reports the gap and how to fill it', () => {
  const [gap] = lineGaps(deck(['A1-002'])) // Ivysaur, no Bulbasaur
  assert.ok(gap)
  assert.equal(gap.missingName, 'Bulbasaur')
  assert.ok(gap.candidates.length > 0)
  assert.equal(gap.candidates[0]!.name, 'Bulbasaur')
})

test('a complete line reports no gap', () => {
  assert.equal(lineGaps(deck(['A1-001', 'A1-002'])).length, 0)
})

test('search puts the prefix match first and the cheapest printing above the rare one', () => {
  const results = quickSearch('pikachu')
  assert.ok(results.length > 0)
  assert.ok(results[0]!.name.toLowerCase().startsWith('pikachu'))
  // A common Pikachu outranks Pikachu ex: the player usually means the one they own.
  const common = results.findIndex((c) => c.rarity === 'C')
  const rare = results.findIndex((c) => c.rarity === 'RR')
  if (common !== -1 && rare !== -1) assert.ok(common < rare)
})

test('an empty query returns nothing rather than everything', () => {
  assert.deepEqual(quickSearch('   '), [])
})
