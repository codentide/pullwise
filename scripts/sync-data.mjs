#!/usr/bin/env node
/**
 * Baja el dataset de cartas de flibustier/pokemon-tcg-pocket-database y genera
 * el bundle que consume la app en src/data/.
 *
 * Se corre a mano cuando sale un set nuevo (`pnpm sync:data`), no en cada build:
 * los datos versionados en el repo hacen que la app arranque sin depender del CDN.
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BASE = 'https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database@latest/dist'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data')

/** Sets cuyas cartas no salen de sobres: el optimizador los ignora. */
const NON_PACK_SETS = new Set(['PROMO-A', 'PROMO-B'])

const get = async (file) => {
  const res = await fetch(`${BASE}/${file}`)
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
  return res.json()
}

const main = async () => {
  console.log('Bajando dataset…')
  // cards.min.json es el catálogo completo; cards.extra.json trae la metadata de
  // deckbuilding pero está incompleto (le faltan ~1300 cartas). Mergeamos: el
  // catálogo manda, extra enriquece donde llega.
  const [rawCards, rawExtra, rawSets, pullRates] = await Promise.all([
    get('cards.min.json'),
    get('cards.extra.json'),
    get('sets.json'),
    get('pullRates.json'),
  ])

  // sets.json viene agrupado por serie y su lista de packs se contradice con la
  // de las cartas en algún set (B4a). Las cartas son la fuente de verdad.
  const sets = Object.entries(rawSets).flatMap(([series, list]) =>
    list.map((s) => ({
      code: s.code,
      series,
      name: s.name.en ?? s.code,
      releaseDate: s.releaseDate,
      packs: [],
      obtainableFromPacks: !NON_PACK_SETS.has(s.code),
    }))
  )
  const setByCode = new Map(sets.map((s) => [s.code, s]))

  // `stage` viene inconsistente: "basic" como string pero 1 y 2 como números.
  // `element` viene a veces capitalizado ("Grass" y "grass" conviven).
  const normStage = (v) => (v === undefined ? undefined : String(v))
  const normElement = (v) => (v === undefined ? undefined : String(v).toLowerCase())
  const normWeakness = (v) =>
    v === undefined || v === null ? undefined : String(v)[0].toUpperCase() + String(v).slice(1).toLowerCase()

  // The in-game deck-share code needs each card's internal id, which is not
  // published as a field — it is embedded in the CDN filename
  // (`cPK_10_000010_00_FUSHIGIDANE_C.webp`). Reimplemented rather than
  // imported from `ptcgp-deckcode` (which computes the same number the same
  // way) so this sync step does not depend on a runtime library just to read
  // one string. Verified against the live dataset before writing this:
  // resolves for all 3,879 cards, zero misses.
  const TRAINER_OFFSET = 1_000_000
  function deckBuilderNrFromImage (image) {
    const m = /^c([A-Z]+)_\d+_(\d{6})_/.exec(String(image ?? ''))
    if (!m) return undefined
    const raw = parseInt(m[2], 10)
    if (!Number.isInteger(raw) || raw % 10 !== 0) return undefined
    const nr = raw / 10
    return m[1] === 'TR' ? TRAINER_OFFSET + nr : nr
  }

  const extraByKey = new Map(rawExtra.map((c) => [`${c.set}-${c.number}`, c]))

  const cards = rawCards.map((c) => {
    const x = extraByKey.get(`${c.set}-${c.number}`) ?? {}
    return {
      id: `${c.set}-${String(c.number).padStart(3, '0')}`,
      set: c.set,
      number: c.number,
      name: c.name,
      rarity: c.rarity,
      packs: c.packs ?? [],
      type: x.type,
      element: normElement(x.element),
      stage: normStage(x.stage),
      evolvesFrom: x.evolvesFrom ?? undefined,
      // `health` y `retreatCost` NO se importan: la fuente los publica como
      // constantes (50 y 1 en las 2.211 cartas que los traen), así que son un
      // placeholder disfrazado de dato. Mostrarlos sería peor que omitirlos.
      weakness: normWeakness(x.weakness),
      deckBuilderNr: deckBuilderNrFromImage(c.image),
    }
  })

  // A los sets de 2026 en adelante el dataset todavía no les publicó la metadata,
  // y son justo los que más se juegan. La rellenamos por nombre: la línea evolutiva
  // es una propiedad del Pokémon, no de la carta — un Ivysaur viene de un Bulbasaur
  // salga en el set que salga. Queda marcado en `inferred` para poder atenuar la
  // validación en la UI si hiciera falta.
  const byName = new Map()
  for (const c of cards) {
    if (c.type === undefined || byName.has(c.name)) continue
    byName.set(c.name, c)
  }

  let inferredCount = 0
  for (const c of cards) {
    if (c.type !== undefined) continue
    const donor = byName.get(c.name)
    if (!donor) continue
    Object.assign(c, {
      type: donor.type,
      element: donor.element,
      stage: donor.stage,
      evolvesFrom: donor.evolvesFrom,
      weakness: donor.weakness,
      inferred: true,
    })
    inferredCount++
  }

  // Lo que sigue sin clasificar se busca en TCGdex, que publica su metadata con
  // otro calendario y cubre sets que el dataset primario todavía no trae. Va sólo
  // sobre las que faltan, y en lotes.
  const stillMissing = cards.filter((c) => c.type === undefined)
  let fromTcgdex = 0

  if (stillMissing.length > 0) {
    console.log(`  consultando TCGdex por ${stillMissing.length} cartas sin clasificar…`)
    const BATCH = 24
    for (let i = 0; i < stillMissing.length; i += BATCH) {
      await Promise.all(
        stillMissing.slice(i, i + BATCH).map(async (card) => {
          const id = `${card.set}-${String(card.number).padStart(3, '0')}`
          try {
            const res = await fetch(`https://api.tcgdex.net/v2/en/cards/${id}`)
            if (!res.ok) return
            const d = await res.json()
            if (d.category == null) return

            // TCGdex usa otro vocabulario: Pokemon/Trainer y Basic/Stage1/Stage2.
            card.type =
              d.category === 'Pokemon'
                ? 'pokemon'
                : String(d.trainerType ?? 'item').toLowerCase()
            card.element = d.types?.[0]?.toLowerCase()
            card.stage =
              d.stage === 'Basic'
                ? 'basic'
                : d.stage === 'Stage1'
                  ? '1'
                  : d.stage === 'Stage2'
                    ? '2'
                    : undefined
            card.evolvesFrom = d.evolveFrom ?? undefined
            card.inferred = true
            fromTcgdex++
          } catch {
            // Lo que TCGdex tampoco tiene queda sin clasificar, que es honesto.
          }
        })
      )
    }
  }

  const known = cards.filter((c) => c.type !== undefined).length
  console.log(
    `  metadata: ${known}/${cards.length} cartas ` +
      `(${inferredCount} por nombre, ${fromTcgdex} desde TCGdex)`
  )

  // Packs reales por set, derivados de las cartas.
  for (const card of cards) {
    const set = setByCode.get(card.set)
    if (!set) continue
    for (const pack of card.packs) if (!set.packs.includes(pack)) set.packs.push(pack)
  }

  // poolCounts[set][pack][rarity] = cuántas cartas distintas de esa rareza puede
  // dar ese sobre. Es el denominador de P(carta puntual | salió esa rareza).
  const poolCounts = {}
  for (const card of cards) {
    for (const pack of card.packs) {
      ;((poolCounts[card.set] ??= {})[pack] ??= {})[card.rarity] =
        (poolCounts[card.set]?.[pack]?.[card.rarity] ?? 0) + 1
    }
  }

  // El dataset publica los pull rates con retraso: los sets más nuevos no los
  // traen. Caemos al set anterior de la misma serie que sí los tenga y dejamos
  // la marca para poder avisarlo en la UI.
  const rateFallbacks = {}
  const chronological = [...sets]
    .filter((s) => s.obtainableFromPacks)
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))

  const sizeOf = (code) => cards.filter((c) => c.set === code).length

  for (const [i, set] of chronological.entries()) {
    if (pullRates[set.code]) continue
    // El donante tiene que compartir formato: misma cantidad de sobres y un
    // tamaño parecido. Un set grande y un mini-set no reparten igual las
    // rarezas, así que copiar del set inmediatamente anterior no alcanza.
    const donor = chronological
      .slice(0, i)
      .filter((prev) => pullRates[prev.code] && prev.packs.length === set.packs.length)
      .sort(
        (a, b) =>
          Math.abs(sizeOf(a.code) - sizeOf(set.code)) -
            Math.abs(sizeOf(b.code) - sizeOf(set.code)) ||
          b.releaseDate.localeCompare(a.releaseDate)
      )[0]
    if (donor) rateFallbacks[set.code] = donor.code
    else console.warn(`  ! ${set.code} sin pull rates y sin set donante`)
  }

  const meta = {
    generatedAt: new Date().toISOString().slice(0, 10),
    source: BASE,
    cardCount: cards.length,
    latestSet: chronological.at(-1)?.code ?? null,
  }

  await mkdir(OUT, { recursive: true })
  const files = { cards, sets, pullRates, poolCounts, rateFallbacks, meta }
  for (const [name, data] of Object.entries(files)) {
    await writeFile(join(OUT, `${name}.json`), JSON.stringify(data), 'utf8')
  }

  console.log(`✓ ${cards.length} cartas · ${sets.length} sets · último: ${meta.latestSet}`)
  const fb = Object.entries(rateFallbacks)
  if (fb.length) {
    console.log(`  pull rates heredados: ${fb.map(([s, d]) => `${s}←${d}`).join(', ')}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
