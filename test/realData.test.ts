/**
 * Tests contra el dataset real. No validan la matemática (eso es packMath.test)
 * sino que los datos sigan teniendo la forma que la matemática asume: si el
 * upstream cambia el formato o publica una tabla rota, acá salta.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { createPackMath } from '../src/lib/packMath.ts'
import { createSimulator } from '../src/lib/simulate.ts'
import type { Card, CardSet, PackRef, PoolCounts, PullRates } from '../src/lib/types.ts'

import cardsJson from '../src/data/cards.json' with { type: 'json' }
import setsJson from '../src/data/sets.json' with { type: 'json' }
import pullRatesJson from '../src/data/pullRates.json' with { type: 'json' }
import poolCountsJson from '../src/data/poolCounts.json' with { type: 'json' }
import rateFallbacksJson from '../src/data/rateFallbacks.json' with { type: 'json' }

const cards = cardsJson as Card[]
const sets = setsJson as CardSet[]
const pullRates = pullRatesJson as PullRates
const poolCounts = poolCountsJson as PoolCounts
const rateFallbacks = rateFallbacksJson as Record<string, string>

const math = createPackMath({ pullRates, poolCounts, rateFallbacks })
const sim = createSimulator(math)

const byId = new Map(cards.map((c) => [c.id, c]))
const allPacks: PackRef[] = sets
  .filter((s) => s.obtainableFromPacks)
  .flatMap((s) => s.packs.map((pack) => ({ set: s.code, pack })))

test('cada slot de cada sobre reparte exactamente el 100%', () => {
  for (const [set, variants] of Object.entries(pullRates)) {
    for (const [variantName, variant] of Object.entries(variants)) {
      for (const [slot, rarities] of Object.entries(variant.slots)) {
        const total = Object.values(rarities).reduce((a, b) => a + b, 0)
        assert.ok(
          Math.abs(total - 100) < 0.01,
          `${set} / ${variantName} / slot ${slot} suma ${total}`
        )
      }
    }
  }
})

test('las variantes de cada set suman el 100% de aparición', () => {
  for (const [set, variants] of Object.entries(pullRates)) {
    const total = Object.values(variants).reduce((a, v) => a + v.appearance_rate, 0)
    assert.ok(Math.abs(total - 100) < 0.01, `${set} suma ${total}`)
  }
})

test('todo sobre de un set abrible tiene rates, propios o heredados', () => {
  for (const pack of allPacks) {
    assert.ok(
      math.variantsFor(pack.set) !== null,
      `${pack.set}/${pack.pack} se quedó sin tabla de rates`
    )
  }
})

test('toda carta que sale de un sobre está contada en el pool de ese sobre', () => {
  for (const card of cards) {
    for (const pack of card.packs) {
      assert.ok(
        math.poolSize({ set: card.set, pack }, card.rarity) > 0,
        `${card.id} (${card.rarity}) dice salir de ${card.set}/${pack} pero el pool está vacío`
      )
    }
  }
})

test('una común se consigue en pocos sobres y una UR en cientos', () => {
  const common = cards.find((c) => c.set === 'A1' && c.rarity === 'C' && c.packs.length > 0)
  const ultra = cards.find((c) => c.set === 'A1' && c.rarity === 'UR')
  assert.ok(common && ultra)

  const run = (card: Card) =>
    sim.simulatePacksToComplete([{ card, needed: 1 }], allPacks, { trials: 400 }).packsMedian

  const commonPacks = run(common)
  const ultraPacks = run(ultra)

  assert.ok(commonPacks < 40, `una común debería salir rápido, dio ${commonPacks}`)
  assert.ok(ultraPacks > 200, `una UR debería costar cientos de sobres, dio ${ultraPacks}`)
})

test('el sobre recomendado es uno que realmente contiene la carta', () => {
  const card = byId.get('A1-036') // Charmander, sobre Charizard
  assert.ok(card)
  const { firstPack } = sim.simulatePacksToComplete([{ card, needed: 1 }], allPacks, {
    trials: 1,
  })
  assert.ok(firstPack)
  assert.equal(firstPack.set, card.set)
  assert.ok(card.packs.includes(firstPack.pack), `recomendó ${firstPack.pack}, no está en la carta`)
})

test('ningún campo del dataset es una constante disfrazada de dato', () => {
  // La fuente publicaba `health: 50` y `retreatCost: 1` en las 2.211 cartas que
  // los traían. Un campo que nunca varía no es un dato: es un placeholder, y
  // publicarlo en las páginas de carta es peor que omitirlo.
  const fields = new Map<string, Set<unknown>>()
  for (const card of cards) {
    for (const [key, value] of Object.entries(card)) {
      if (value === undefined || value === null) continue
      if (typeof value === 'object') continue
      // Los flags booleanos que sólo existen cuando son true (como `inferred`)
      // son un patrón válido, no un placeholder.
      if (typeof value === 'boolean') continue
      ;(fields.get(key) ?? fields.set(key, new Set()).get(key)!).add(value)
    }
  }

  for (const [field, values] of fields) {
    const present = cards.filter(
      (card) => (card as Record<string, unknown>)[field] !== undefined
    ).length
    // Un único valor distinto en cientos de cartas sólo puede ser un placeholder.
    if (present >= 100) {
      assert.ok(
        values.size > 1,
        `el campo "${field}" vale siempre ${[...values][0]} en ${present} cartas: es un placeholder, no un dato`
      )
    }
  }
})
