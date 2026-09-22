import test from 'node:test'
import assert from 'node:assert/strict'
import { filterCards, emptyFilters } from '../src/lib/filters.ts'
import { cardsById } from '../src/lib/gameData.ts'
import type { Card, Knowledge } from '../src/lib/types.ts'

// Bulbasaur (A1, grass), Erika (A1, supporter), Pikachu ex (A1, lightning),
// Cosmog (A3, psychic) — real cards, spread across sets/rarities/kinds.
const pool: Card[] = ['A1-001', 'A1-219', 'A1-096', 'A3-085'].map(
  (id) => cardsById.get(id)!
)

test('empty filters return every card unchanged', () => {
  const result = filterCards(pool, emptyFilters, {})
  assert.deepEqual(result.map((c) => c.id), pool.map((c) => c.id))
})

test('filters by set', () => {
  const result = filterCards(pool, { ...emptyFilters, set: 'A1' }, {})
  assert.deepEqual(result.map((c) => c.id).sort(), ['A1-001', 'A1-096', 'A1-219'])
})

test('filters by rarity', () => {
  const result = filterCards(pool, { ...emptyFilters, rarity: 'RR' }, {})
  assert.deepEqual(result.map((c) => c.id), ['A1-096'])
})

test('filters by element', () => {
  const result = filterCards(pool, { ...emptyFilters, element: 'grass' }, {})
  assert.deepEqual(result.map((c) => c.id), ['A1-001'])
})

test('filters pokemon vs trainer kind', () => {
  const pokemon = filterCards(pool, { ...emptyFilters, kind: 'pokemon' }, {})
  assert.ok(!pokemon.some((c) => c.id === 'A1-219')) // Erika, a supporter, excluded

  const trainers = filterCards(pool, { ...emptyFilters, kind: 'trainer' }, {})
  assert.deepEqual(trainers.map((c) => c.id), ['A1-219'])
})

test('onlyKnown drops cards nobody has formed an opinion about yet', () => {
  const knowledge: Knowledge = { 'A1-001': 1 }
  const result = filterCards(pool, { ...emptyFilters, onlyKnown: true }, knowledge)
  assert.deepEqual(result.map((c) => c.id), ['A1-001'])
})

test('text search matches by normalized name', () => {
  const result = filterCards(pool, { ...emptyFilters, text: 'pika' }, {})
  assert.deepEqual(result.map((c) => c.id), ['A1-096'])
})

test('combined filters narrow down together', () => {
  const result = filterCards(pool, { ...emptyFilters, set: 'A1', kind: 'pokemon' }, {})
  assert.deepEqual(result.map((c) => c.id).sort(), ['A1-001', 'A1-096'])
})
