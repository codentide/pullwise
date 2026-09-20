import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDeckCode } from 'ptcgp-deckcode'
import { buildDeckCode } from '../src/lib/deckCode.ts'
import type { Card, Deck } from '../src/lib/types.ts'

/** A hand-built card, not one from the real dataset — keeps the test self-contained. */
const card = (id: string, deckBuilderNr: number): Card => ({
  id,
  set: 'X',
  number: 1,
  name: id,
  rarity: 'C',
  packs: [],
  deckBuilderNr
})

const cardsById = new Map<string, Card>([
  ['a', card('a', 1)],
  ['b', card('b', 4)],
  ['c', card('c', 1_000_003)]
])

// Swaps the real dataset lookup for the fixture above, and back, around each test.
const gameData = await import('../src/lib/gameData.ts')
const originalGet = gameData.cardsById.get.bind(gameData.cardsById)
test.beforeEach(() => { gameData.cardsById.get = (id: string) => cardsById.get(id) })
test.afterEach(() => { gameData.cardsById.get = originalGet })

const deck = (entries: Array<[string, number]>, energy?: string[]): Deck => ({
  id: 'd',
  name: 'Test',
  entries: entries.map(([cardId, copies]) => ({ cardId, copies })),
  energy,
  updatedAt: 0
})

test('round-trips through the library\'s own decoder', () => {
  // 2x a, 2x b, 16x c — 20 cards, two energy types.
  const result = buildDeckCode(deck([['a', 2], ['b', 2], ['c', 16]], ['fire', 'water']))
  assert.equal(result.ok, true)
  if (!result.ok) return

  const decoded = parseDeckCode(result.code)
  assert.deepEqual(decoded.deckBuilderNrs.sort((x, y) => x - y), [1, 1, 4, 4, ...Array(16).fill(1_000_003)].sort((x, y) => x - y))
  assert.deepEqual([...decoded.energies].sort(), ['fire', 'water'])
  assert.deepEqual([...result.energy].sort(), ['fire', 'water'])
})

test('genera código para un mazo incompleto: el formato no exige 20 cartas', () => {
  // Un mazo a medio construir sigue siendo algo escaneable — solo importa
  // menos cartas al juego, no deja de ser un mazo válido para compartir.
  const result = buildDeckCode(deck([['a', 2]], ['fire']))
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.deepEqual(parseDeckCode(result.code).deckBuilderNrs, [1, 1])
})

test('rechaza un mazo vacío: no hay nada que codificar', () => {
  const result = buildDeckCode(deck([], ['fire']))
  assert.deepEqual(result, { ok: false, reason: 'empty' })
})

test('rechaza un mazo sin ningún tipo de energía, inferido o explícito', () => {
  // Todo trainer: no hay elemento del que inferir, y no se marcó ninguno a mano.
  const result = buildDeckCode(deck([['c', 20]]))
  assert.deepEqual(result, { ok: false, reason: 'noEnergy' })
})

test('un tipo de energía sin equivalente en la zona de energía cuenta como ninguno', () => {
  // dragon y colorless existen como elemento de carta pero nunca como opción
  // de la Energy Zone del juego.
  const result = buildDeckCode(deck([['a', 2]], ['dragon']))
  assert.deepEqual(result, { ok: false, reason: 'noEnergy' })
})
