import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDecklist, toDecklist } from '../src/lib/decklist.ts'
import { cardsById } from '../src/lib/gameData.ts'
import type { Deck } from '../src/lib/types.ts'

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

test('resuelve un set con sufijo en minúscula sin importar cómo lo tipeen', () => {
  // Bug real: 13 de los 23 sets llevan sufijo minúscula en su id (B1a, A2b...).
  // Antes, el código se forzaba a mayúsculas ("B1A"), que no existe, y la
  // búsqueda caía en el fallback por nombre — que devuelve OTRA impresión, con
  // otros sobres, sin avisar de nada. Probado con las tres formas de tipear
  // que alguien realmente usaría.
  for (const raw of ['B1a', 'b1a', 'B1A']) {
    const { entries, unresolved } = parseDecklist(`1 Magnezone ${raw} 26`)
    assert.equal(unresolved.length, 0, `no resolvió "${raw}"`)
    assert.equal(entries[0]!.cardId, 'B1a-026', `"${raw}" resolvió a la impresión equivocada`)
  }
})

test('extrae la zona de energía de una lista real, en vez de tirarla', () => {
  const { energy } = parseDecklist('2 Bulbasaur\n\nEnergy: Lightning')
  assert.deepEqual(energy, ['lightning'])
})

test('reconoce más de un tipo de energía en la misma línea', () => {
  const { energy } = parseDecklist('Energy: Water, Lightning')
  assert.deepEqual(energy, ['water', 'lightning'])
})

test('un encabezado de energía sin nombres reconocibles no inventa nada', () => {
  const { energy, entries } = parseDecklist('2 Bulbasaur\nEnergy: 8')
  assert.equal(energy, undefined)
  assert.equal(entries.length, 1)
})

test('una lista sin línea de energía no la reporta', () => {
  const { energy } = parseDecklist('2 Bulbasaur')
  assert.equal(energy, undefined)
})

test('exporta un mazo y vuelve a parsear las mismas entradas', () => {
  const deck: Deck = {
    id: 'd',
    name: 'Test',
    updatedAt: 0,
    entries: [
      { cardId: 'A1-096', copies: 2 }, // Pikachu ex
      { cardId: 'A1-033', copies: 2 }, // Charmander
      { cardId: 'A1-219', copies: 1 } // Erika (supporter)
    ],
    energy: ['lightning', 'fire']
  }

  const text = toDecklist(deck)
  const { entries, unresolved, energy } = parseDecklist(text)

  assert.equal(unresolved.length, 0)
  assert.deepEqual(
    [...entries].sort((a, b) => a.cardId.localeCompare(b.cardId)),
    [...deck.entries].sort((a, b) => a.cardId.localeCompare(b.cardId))
  )
  assert.deepEqual(energy, ['lightning', 'fire'])
})

test('exporta trainers en su propia sección, separados de los Pokémon', () => {
  const deck: Deck = {
    id: 'd',
    name: 'Test',
    updatedAt: 0,
    entries: [{ cardId: 'A1-096', copies: 2 }, { cardId: 'A1-219', copies: 1 }],
    energy: ['lightning']
  }

  const text = toDecklist(deck)
  assert.match(text, /^Pokémon: 2\n2 Pikachu ex A1 096\nTrainer: 1\n1 Erika A1 219\nEnergy: Lightning$/)
})

test('un mazo sin energía explícita ni inferible no imprime la sección Energy', () => {
  const deck: Deck = {
    id: 'd',
    name: 'Test',
    updatedAt: 0,
    entries: [{ cardId: 'A1-219', copies: 1 }] // solo un trainer, no infiere elemento
  }

  const text = toDecklist(deck)
  assert.doesNotMatch(text, /Energy/)
})
