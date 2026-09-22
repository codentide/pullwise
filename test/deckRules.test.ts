import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDeck } from '../src/lib/deckRules.ts'
import type { Deck } from '../src/lib/types.ts'

const deck = (entries: Array<[string, number]>): Deck => ({
  id: 'd',
  name: 'test',
  updatedAt: 0,
  entries: entries.map(([cardId, copies]) => ({ cardId, copies })),
})

test('fewer than 20 cards trips tooFewCards with the exact shortfall', () => {
  const issues = validateDeck(deck([['A1-096', 1]]))
  const issue = issues.find((i) => i.code === 'tooFewCards')
  assert.ok(issue)
  assert.equal(issue!.count, 19)
  assert.equal(issue!.size, 20)
})

test('more than 20 cards trips tooManyCards with the exact excess', () => {
  const issues = validateDeck(deck([
    ['A1-001', 2], ['A1-005', 2], ['A1-008', 2], ['A1-011', 2], ['A1-014', 2],
    ['A1-016', 2], ['A1-018', 2], ['A1-021', 2], ['A1-024', 2], ['A1-025', 2], ['A1-026', 2],
  ]))
  const issue = issues.find((i) => i.code === 'tooManyCards')
  assert.ok(issue)
  assert.equal(issue!.count, 2)
  assert.equal(issue!.size, 20)
})

test('the copy cap is per card name, so two printings combine against it', () => {
  // A1-001 and A1-227 are both "Bulbasaur", just different printings: 2 + 1 = 3,
  // over the cap of 2 — even though neither entry alone breaks it.
  const issues = validateDeck(deck([['A1-001', 2], ['A1-227', 1]]))
  const issue = issues.find((i) => i.code === 'tooManyCopies')
  assert.ok(issue)
  assert.equal(issue!.name, 'Bulbasaur')
  assert.equal(issue!.copies, 3)
  assert.equal(issue!.max, 2)
})

test('an all-evolution deck with no basic trips noBasic', () => {
  // Ivysaur alone: a stage-1 card, no basic in the deck at all.
  const issues = validateDeck(deck([['A1-002', 2]]))
  assert.ok(issues.some((i) => i.code === 'noBasic'))
})

test('an evolution without its base card trips evolutionWithoutBase', () => {
  const issues = validateDeck(deck([['A1-002', 2]])) // Ivysaur, no Bulbasaur
  const issue = issues.find((i) => i.code === 'evolutionWithoutBase')
  assert.ok(issue)
  assert.equal(issue!.name, 'Ivysaur')
  assert.equal(issue!.from, 'Bulbasaur')
})

test('a card with no type metadata trips unknownMetadata', () => {
  // Mega Latios ex ships with no `type` field in the dataset.
  const issues = validateDeck(deck([['PROMO-B-024', 1]]))
  const issue = issues.find((i) => i.code === 'unknownMetadata')
  assert.ok(issue)
  assert.equal(issue!.count, 1)
})

test('a complete evolution line with no unknown metadata reports none of the optional issues', () => {
  // Bulbasaur, Ivysaur, Venusaur: full line, all metadata known.
  const issues = validateDeck(deck([['A1-001', 2], ['A1-002', 2], ['A1-003', 2]]))
  assert.ok(!issues.some((i) => i.code === 'noBasic'))
  assert.ok(!issues.some((i) => i.code === 'evolutionWithoutBase'))
  assert.ok(!issues.some((i) => i.code === 'unknownMetadata'))
  assert.ok(!issues.some((i) => i.code === 'tooManyCopies'))
})
