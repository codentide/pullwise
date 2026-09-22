/** Pack probabilities: each of a pack's 5 slots draws a rarity from its own table then a uniform card of that rarity — P(slot i yields c) = rate(i, rarity(c)) / pool(set, pack, rarity(c)) — averaged across a set's common and 0.05%-rare pack variants; this module is pure (data passed in, not imported) so the maths is testable against hand-checkable synthetic datasets. */
import type { Card, MissingCard, PackRef, PoolCounts, PullRates } from './types.ts'

export interface PackMathData {
  pullRates: PullRates
  poolCounts: PoolCounts
  /** Sets whose odds are not published yet and borrow another set's. */
  rateFallbacks: Record<string, string>
}

/** A pack variant resolved to per-slot probabilities, expressed 0..1. */
interface ResolvedVariant {
  weight: number
  slots: Record<string, number>[]
}

export interface PackRanking {
  pack: PackRef
  /** Chance that a pack contains at least one card you are missing. */
  chanceOfUseful: number
  /** Expected useful copies per pack. */
  expectedUseful: number
  /** This set's odds are borrowed from another set. */
  estimated: boolean
}

export interface SimulationResult {
  packsMedian: number
  packsP90: number
  /** Some run hit the pack ceiling: the numbers are a lower bound. */
  censored: boolean
}

const packKey = (p: PackRef) => `${p.set}/${p.pack}`

export function createPackMath (data: PackMathData) {
  const { pullRates, poolCounts, rateFallbacks } = data
  const variantCache = new Map<string, ResolvedVariant[] | null>()

  /** Which set's odds apply here: its own, or the donor's. */
  function rateSource (set: string): string | undefined {
    if (pullRates[set]) return set
    const donor = rateFallbacks[set]
    return donor && pullRates[donor] ? donor : undefined
  }

  const usesEstimatedRates = (set: string) => rateSource(set) !== undefined && !pullRates[set]

  /** Pack variants with their slots normalised to 0..1 probabilities. */
  function variantsFor (set: string): ResolvedVariant[] | null {
    const cached = variantCache.get(set)
    if (cached !== undefined) return cached

    const source = rateSource(set)
    const table = source ? pullRates[source] : undefined
    let resolved: ResolvedVariant[] | null = null

    if (table) {
      resolved = Object.values(table).map((variant) => ({
        weight: variant.appearance_rate / 100,
        // Slot keys are "1".."5": sort numerically so we do not depend on the JSON's insertion order.
        slots: Object.entries(variant.slots)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([, rarities]) =>
            Object.fromEntries(Object.entries(rarities).map(([r, pct]) => [r, pct / 100]))
          ),
      }))
    }

    variantCache.set(set, resolved)
    return resolved
  }

  /** How many distinct cards of that rarity the pack can yield. */
  function poolSize (pack: PackRef, rarity: string): number {
    return poolCounts[pack.set]?.[pack.pack]?.[rarity] ?? 0
  }

  function isInPack (card: Card, pack: PackRef): boolean {
    return card.set === pack.set && card.packs.includes(pack.pack)
  }

  /** Expected copies of one specific card per pack opened. */
  function expectedCopies (card: Card, pack: PackRef): number {
    if (!isInPack(card, pack)) return 0
    const variants = variantsFor(card.set)
    if (!variants) return 0
    const pool = poolSize(pack, card.rarity)
    if (pool === 0) return 0

    let expected = 0
    for (const variant of variants) {
      for (const slot of variant.slots) {
        expected += (variant.weight * (slot[card.rarity] ?? 0)) / pool
      }
    }
    return expected
  }

  /** Chance that a slot yields one of the wanted cards, grouped by rarity so the list is not walked once per card. */
  function slotHitProbability (
    slot: Record<string, number>,
    countByRarity: Map<string, number>,
    pack: PackRef
  ): number {
    let p = 0
    for (const [rarity, count] of countByRarity) {
      const rate = slot[rarity]
      if (!rate) continue
      const pool = poolSize(pack, rarity)
      if (pool > 0) p += (rate * count) / pool
    }
    return p
  }

  /** How many of the wanted cards this pack holds, grouped by rarity. */
  function wantedByRarity (missing: MissingCard[], pack: PackRef): Map<string, number> {
    const counts = new Map<string, number>()
    for (const { card } of missing) {
      if (!isInPack(card, pack)) continue
      counts.set(card.rarity, (counts.get(card.rarity) ?? 0) + 1)
    }
    return counts
  }

  /** Ranks packs by how much they close the gap on what is missing; `expectedUseful` marginally overcounts (double-counts a card already covered in the same pack), negligible at ~1% per-card probabilities and never reorders the ranking — `simulate` models it exactly. */
  function rankPacks (missing: MissingCard[], packs: PackRef[]): PackRanking[] {
    const ranked: PackRanking[] = []

    for (const pack of packs) {
      const variants = variantsFor(pack.set)
      if (!variants) continue
      const counts = wantedByRarity(missing, pack)
      if (counts.size === 0) continue

      let chance = 0
      let expected = 0
      for (const variant of variants) {
        let noneInVariant = 1
        for (const slot of variant.slots) {
          const p = slotHitProbability(slot, counts, pack)
          expected += variant.weight * p
          noneInVariant *= 1 - p
        }
        chance += variant.weight * (1 - noneInVariant)
      }

      ranked.push({
        pack,
        chanceOfUseful: chance,
        expectedUseful: expected,
        estimated: usesEstimatedRates(pack.set),
      })
    }

    return ranked.sort((a, b) => b.chanceOfUseful - a.chanceOfUseful)
  }

  return { expectedCopies, rankPacks, variantsFor, poolSize, isInPack, usesEstimatedRates }
}

export type PackMath = ReturnType<typeof createPackMath>
export { packKey }
