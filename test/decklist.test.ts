import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDecklist } from '../src/lib/decklist.ts'
import { cardsById } from '../src/lib/gameData.ts'

const nameOf = (id: string) => cardsById.get(id)?.name

test('parsea el formato con set y número', () => {
  const { entries, unresolved } = parseDecklist(`
Pokémon: 6
2 Pikachu ex A1 096
2 Charmander A1 033
  `)
  assert.equal(unresolved.length, 0)
  assert.equal(entries.length, 2)
  assert.equal(nameOf('A1-096'), 'Pikachu ex')
  assert.deepEqual(
    entries.map((e) => [e.cardId, e.copies]),
    [
      ['A1-096', 2],
      ['A1-033', 2],
    ]
  )
})

test('resuelve por nombre cuando no hay set', () => {
  const { entries, unresolved } = parseDecklist('2 Bulbasaur')
  assert.equal(unresolved.length, 0)
  assert.equal(entries.length, 1)
  assert.equal(nameOf(entries[0]!.cardId), 'Bulbasaur')
})

test('ignora encabezados de sección y líneas vacías', () => {
  const { entries } = parseDecklist(`
Pokémon: 12

Trainer: 8
Energy
2 Bulbasaur
  `)
  assert.equal(entries.length, 1)
})

test('suma las copias de una carta repetida en dos líneas', () => {
  const { entries } = parseDecklist('1 Bulbasaur A1 001\n1 Bulbasaur A1 001')
  assert.equal(entries.length, 1)
  assert.equal(entries[0]!.copies, 2)
})

test('reporta lo que no pudo resolver en vez de tragárselo', () => {
  const { entries, unresolved } = parseDecklist('2 Pokémon Que No Existe\n2 Bulbasaur')
  assert.equal(entries.length, 1)
  assert.deepEqual(unresolved, ['2 Pokémon Que No Existe'])
})

test('traduce el código de promo del formato de listas al del dataset', () => {
  const { entries, unresolved } = parseDecklist('2 Potion P-A 001')
  assert.equal(unresolved.length, 0)
  assert.equal(entries[0]!.cardId, 'PROMO-A-001')
})
