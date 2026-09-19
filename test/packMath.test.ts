import test from 'node:test'
import assert from 'node:assert/strict'
import { createPackMath, type PackMathData } from '../src/lib/packMath.ts'
import { createSimulator } from '../src/lib/simulate.ts'
import type { Card, PackRef } from '../src/lib/types.ts'

/** RNG determinista, para que los tests de simulación no sean flaky. */
function mulberry32 (seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const card = (over: Partial<Card> = {}): Card => ({
  id: 'T-001',
  set: 'T',
  number: 1,
  name: 'Test',
  rarity: 'C',
  packs: ['Solo'],
  ...over,
})

/** Un set con un sobre, `slots` slots que dan siempre común, y `pool` comunes. */
const simpleData = (slots: number, pool: number): PackMathData => ({
  pullRates: {
    T: {
      'Regular Pack': {
        appearance_rate: 100,
        cards: slots,
        slots: Object.fromEntries(
          Array.from({ length: slots }, (_, i) => [String(i + 1), { C: 100 }])
        ),
      },
    },
  },
  poolCounts: { T: { Solo: { C: pool } } },
  rateFallbacks: {},
})

const PACK: PackRef = { set: 'T', pack: 'Solo' }

test('expectedCopies: un slot y un pool de 2 da media copia por sobre', () => {
  const m = createPackMath(simpleData(1, 2))
  assert.equal(m.expectedCopies(card(), PACK), 0.5)
})

test('expectedCopies: los slots se suman', () => {
  const m = createPackMath(simpleData(3, 6))
  assert.equal(m.expectedCopies(card(), PACK), 0.5) // 3 slots x 1/6
})

test('expectedCopies: una carta de otro sobre del set da cero', () => {
  const m = createPackMath(simpleData(1, 2))
  assert.equal(m.expectedCopies(card({ packs: ['Otro'] }), PACK), 0)
})

test('expectedCopies: una promo sin sobres da cero', () => {
  const m = createPackMath(simpleData(1, 2))
  assert.equal(m.expectedCopies(card({ packs: [] }), PACK), 0)
})

test('rankPacks: la probabilidad compone los slots, no los suma', () => {
  const m = createPackMath(simpleData(2, 2))
  const [r] = m.rankPacks([{ card: card(), needed: 1 }], [PACK])
  assert.ok(r)
  // Dos tiros al 50%: 1 - 0.5^2, no 1.0.
  assert.equal(r.chanceOfUseful, 0.75)
  assert.equal(r.expectedUseful, 1)
})

test('rankPacks: las variantes se ponderan por su frecuencia', () => {
  const m = createPackMath({
    pullRates: {
      T: {
        'Regular Pack': { appearance_rate: 90, cards: 1, slots: { 1: { C: 100 } } },
        // El rare pack nunca trae comunes: sólo aporta su 10% de "no sale".
        'Rare Pack': { appearance_rate: 10, cards: 1, slots: { 1: { SR: 100 } } },
      },
    },
    poolCounts: { T: { Solo: { C: 2, SR: 4 } } },
    rateFallbacks: {},
  })
  const [r] = m.rankPacks([{ card: card(), needed: 1 }], [PACK])
  assert.ok(r)
  assert.equal(r.chanceOfUseful, 0.9 * 0.5)
})

test('rateFallbacks: un set sin rates usa los del donante y queda marcado', () => {
  const base = simpleData(1, 2)
  const m = createPackMath({
    pullRates: base.pullRates,
    poolCounts: { ...base.poolCounts, NUEVO: { Solo: { C: 2 } } },
    rateFallbacks: { NUEVO: 'T' },
  })
  const nuevo: PackRef = { set: 'NUEVO', pack: 'Solo' }
  assert.equal(m.expectedCopies(card({ set: 'NUEVO' }), nuevo), 0.5)
  assert.equal(m.usesEstimatedRates('NUEVO'), true)
  assert.equal(m.usesEstimatedRates('T'), false)
})

test('simulate: la mediana coincide con la geométrica teórica', () => {
  // Un slot, pool de 10, una carta buscada => p = 0,1 por sobre.
  const m = createPackMath(simpleData(1, 10))
  const sim = createSimulator(m)
  const p = 0.1
  const theoreticalMedian = Math.ceil(Math.log(0.5) / Math.log(1 - p))
  const theoreticalP90 = Math.ceil(Math.log(0.1) / Math.log(1 - p))

  const result = sim.simulatePacksToComplete([{ card: card(), needed: 1 }], [PACK], {
    trials: 4000,
    random: mulberry32(42),
  })

  assert.equal(result.censored, false)
  assert.ok(
    Math.abs(result.packsMedian - theoreticalMedian) <= 1,
    `mediana ${result.packsMedian} vs teórica ${theoreticalMedian}`
  )
  assert.ok(
    Math.abs(result.packsP90 - theoreticalP90) <= 2,
    `p90 ${result.packsP90} vs teórica ${theoreticalP90}`
  )
})

test('simulate: pedir dos copias cuesta más que pedir una', () => {
  const m = createPackMath(simpleData(1, 10))
  const sim = createSimulator(m)
  const run = (needed: number) =>
    sim.simulatePacksToComplete([{ card: card(), needed }], [PACK], {
      trials: 2000,
      random: mulberry32(7),
    }).packsMedian

  assert.ok(run(2) > run(1), 'dos copias deberían costar más sobres que una')
})

test('simulate: sin cartas obtenibles no inventa un sobre', () => {
  const m = createPackMath(simpleData(1, 2))
  const sim = createSimulator(m)
  const r = sim.simulatePacksToComplete([{ card: card({ packs: [] }), needed: 1 }], [PACK])
  assert.equal(r.firstPack, null)
  assert.equal(r.packsMedian, 0)
})
