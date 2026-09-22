/** How many packs it takes to complete what is missing, by Monte Carlo — gives what `rankPacks`'s expectation can't (openings needed, needing two copies), staying cheap by drawing a slot's rarity and checking `wantedOfThatRarity / poolOfThatRarity` (O(rarities), not O(cards)), always opening whatever pack ranks best for what's still missing at that moment. */
import type { PackMath } from './packMath.ts'
import type { MissingCard, PackRef } from './types.ts'

export interface SimulationResult {
  packsMedian: number
  packsP90: number
  /** Some run hit the ceiling: the numbers are a lower bound. */
  censored: boolean
  /** Recommended pack for the first step. */
  firstPack: PackRef | null
}

export interface SimulateOptions {
  trials?: number
  /** Per-run ceiling, so an ultra-rare card cannot hang the calculation. */
  maxPacks?: number
  random?: () => number
}

/** A card still pending during the simulation, groupable by rarity. */
interface Pending {
  card: MissingCard['card']
  remaining: number
}

/** Small deterministic PRNG, so runs can be seeded. */
export function mulberry32 (seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable seed from what is missing: the same deck always yields the same number. */
export function seedFor (missing: MissingCard[]): number {
  let hash = 2166136261
  for (const { card, needed } of [...missing].sort((a, b) => a.card.id.localeCompare(b.card.id))) {
    for (const ch of `${card.id}x${needed}`) {
      hash ^= ch.charCodeAt(0)
      hash = Math.imul(hash, 16777619)
    }
  }
  return hash >>> 0
}

export function createSimulator (packMath: PackMath) {
  /** Opens one pack, deducts useful copies from `pending`, and returns the count — or -1 if the pack has no odds table (shouldn't happen: the ranking already filtered those out). */
  function openPack (
    pack: PackRef,
    pending: Pending[],
    random: () => number
  ): number {
    const variants = packMath.variantsFor(pack.set)
    if (!variants) return -1

    let roll = random()
    let variant = variants[variants.length - 1]!
    for (const candidate of variants) {
      if (roll < candidate.weight) {
        variant = candidate
        break
      }
      roll -= candidate.weight
    }

    const byRarity = new Map<string, Pending[]>()
    for (const p of pending) {
      if (!packMath.isInPack(p.card, pack)) continue
      const list = byRarity.get(p.card.rarity)
      if (list) list.push(p)
      else byRarity.set(p.card.rarity, [p])
    }
    if (byRarity.size === 0) return 0

    let hits = 0
    for (const slot of variant.slots) {
      let r = random()
      let rarity: string | undefined
      for (const [candidate, prob] of Object.entries(slot)) {
        if (r < prob) {
          rarity = candidate
          break
        }
        r -= prob
      }
      if (rarity === undefined) continue

      const wanted = byRarity.get(rarity)
      if (!wanted || wanted.length === 0) continue

      // The pool includes cards already owned, so the chance the draw is one of the missing ones is only proportional, not certain.
      const pool = packMath.poolSize(pack, rarity)
      if (pool === 0) continue
      if (random() * pool >= wanted.length) continue

      const picked = wanted[Math.floor(random() * wanted.length)]!
      picked.remaining--
      hits++
      if (picked.remaining === 0) {
        byRarity.set(
          rarity,
          wanted.filter((p) => p !== picked)
        )
      }
    }
    return hits
  }

  function simulatePacksToComplete (
    missing: MissingCard[],
    packs: PackRef[],
    options: SimulateOptions = {}
  ): SimulationResult {
    const { trials = 600, maxPacks = 3000, random = Math.random } = options

    // Only cards some pack can yield count: promos are earned elsewhere, and waiting for one out of a pack would never terminate.
    const obtainable = missing.filter((m) =>
      packs.some((pack) => packMath.isInPack(m.card, pack))
    )
    const initialRanking = packMath.rankPacks(obtainable, packs)
    const firstPack = initialRanking[0]?.pack ?? null

    if (obtainable.length === 0 || firstPack === null) {
      return { packsMedian: 0, packsP90: 0, censored: false, firstPack: null }
    }

    const results: number[] = []
    let censored = false

    for (let trial = 0; trial < trials; trial++) {
      const pending: Pending[] = obtainable.map((m) => ({
        card: m.card,
        remaining: m.needed,
      }))
      let left = pending.length
      let opened = 0
      let best = firstPack

      while (left > 0 && opened < maxPacks) {
        const hits = openPack(best, pending, random)
        opened++
        if (hits <= 0) continue

        const stillPending = pending.filter((p) => p.remaining > 0)
        if (stillPending.length === left) continue

        // What is missing changed: a different pack may be better from here.
        left = stillPending.length
        if (left === 0) break
        best =
          packMath.rankPacks(
            stillPending.map((p) => ({ card: p.card, needed: p.remaining })),
            packs
          )[0]?.pack ?? best
      }

      if (opened >= maxPacks && left > 0) censored = true
      results.push(opened)
    }

    results.sort((a, b) => a - b)
    const at = (q: number) => results[Math.min(results.length - 1, Math.floor(q * results.length))]!

    return { packsMedian: at(0.5), packsP90: at(0.9), censored, firstPack }
  }

  return { simulatePacksToComplete }
}
