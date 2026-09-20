import test from 'node:test'
import assert from 'node:assert/strict'
import { inferEnergy, resolvedEnergy } from '../src/lib/energy.ts'
import type { Deck } from '../src/lib/types.ts'

const deck = (entries: Array<[string, number]>, energy?: string[]): Deck => ({
  id: 'd',
  name: 'Test',
  entries: entries.map(([cardId, copies]) => ({ cardId, copies })),
  energy,
  updatedAt: 0
})

test('infiere el elemento más presente primero', () => {
  // Pikachu ex y Zapdos ex son lightning, Bulbasaur es grass: dos contra uno.
  const result = inferEnergy(deck([['A1-096', 2], ['A1-104', 2], ['A1-001', 2]]))
  assert.deepEqual(result, ['lightning', 'grass'])
})

test('ignora cartas sin elemento en vez de adivinar', () => {
  // Una carta sin `element` (entrenador, o pokemon sin clasificar) no debe
  // aparecer como si fuera un elemento vacío.
  const result = inferEnergy(deck([['PROMO-A-001', 2]]))
  assert.deepEqual(result, [])
})

test('un mazo sin energía explícita se resuelve como inferido', () => {
  const { energy, inferred } = resolvedEnergy(deck([['A1-096', 2]]))
  assert.equal(inferred, true)
  assert.deepEqual(energy, ['lightning'])
})

test('la energía explícita gana, incluso vacía', () => {
  const { energy, inferred } = resolvedEnergy(deck([['A1-096', 2]], []))
  assert.equal(inferred, false)
  assert.deepEqual(energy, [])
})
