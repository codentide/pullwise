import test from 'node:test'
import assert from 'node:assert/strict'
import { inferEnergy, resolvedEnergy, isEnergy, weaknessEnergy } from '../src/lib/energy.ts'
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
  // Una carta sin `element` (entrenador, o pokemon sin clasificar) no debe aparecer como si fuera un elemento vacío.
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

test('la inferencia nunca excede los 3 tipos que la Energy Zone realmente tiene', () => {
  // Cuatro elementos distintos entre los Pokémon del mazo: lightning, metal, psychic, water. Sólo los tres más representados deben aparecer.
  const result = inferEnergy(deck([
    ['A1-096', 2], // Pikachu ex, lightning ×2
    ['A1-104', 2], // Zapdos ex, lightning ×2 (lightning: 4 en total)
    ['A3-122', 2], // Solgaleo ex, metal ×2
    ['A2-119', 2], // Dialga ex, metal ×2 (metal: 4 en total)
    ['A1-084', 2], // Articuno ex, water ×2
    ['A3-085', 2], // Cosmog, psychic ×2
  ]))
  assert.equal(result.length, 3)
  assert.deepEqual(result.slice(0, 2).sort(), ['lightning', 'metal'])
})

test('isEnergy reconoce las diez claves y rechaza lo demás', () => {
  assert.equal(isEnergy('grass'), true)
  assert.equal(isEnergy('darkness'), true)
  assert.equal(isEnergy('Fire'), false) // el guard no normaliza mayúsculas por sí solo
  assert.equal(isEnergy('unknown'), false)
})

test('weaknessEnergy normaliza mayúsculas y el caso especial "Dark" -> "darkness"', () => {
  assert.equal(weaknessEnergy('Fire'), 'fire')
  assert.equal(weaknessEnergy('Dark'), 'darkness')
  assert.equal(weaknessEnergy('Water'), 'water')
})

test('weaknessEnergy devuelve null para un valor que no es una energía real', () => {
  assert.equal(weaknessEnergy('Unknown'), null)
})
