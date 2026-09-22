#!/usr/bin/env node
/**
 * Gates the first-load JS of the public (site) routes — the SEO-critical pages
 * that ship to anonymous search traffic, as opposed to the (app) routes, which
 * are the interactive tool and can reasonably carry more JS.
 *
 * Next 16 dropped the `First Load JS` summary from `next build`'s terminal
 * output, but still writes the real per-route numbers to
 * .next/diagnostics/route-bundle-stats.json. Nobody was reading that file, so
 * a regression (e.g. a heavy import creeping back into a shared component)
 * would ship silently — which is exactly what happened once already: a 717KB
 * dataset accidentally bundled into AppHeader pushed every (site) route to
 * ~1.25MB raw before it was caught and fixed. This script is the mechanical
 * gate so next time it fails CI instead of a person noticing by chance.
 *
 * Run after `pnpm build:only` (see .github/workflows/ci.yml), not standalone —
 * it only reads what the build already wrote.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const STATS_PATH = join(ROOT, '.next', 'diagnostics', 'route-bundle-stats.json')

// The public, indexable pages. (app)'s /cards, /decks, /decks/[id] and /packs
// are deliberately not in this list — they're the interactive tool, gated by
// nothing here.
const SITE_ROUTES = [
  '/[locale]',
  '/[locale]/card/[id]',
  '/[locale]/set/[code]',
  '/[locale]/pack/[set]/[name]'
]

// Measured on 2026-09-21 (after P1-P9 of PWS-012 landed on develop): the
// heaviest (site) route was /[locale]/card/[id] at 584,782 bytes (~571KB)
// raw first-load JS, the others in the same batch a little lower. 700KB
// (716,800 bytes) gives ~22% headroom over that — enough that normal
// dependency churn doesn't trip the gate, while still catching anything
// that adds real weight (a dataset, a heavy library) to a page that ships
// to anonymous search traffic.
const BUDGET_BYTES = 700 * 1024

const formatKB = (bytes) => `${(bytes / 1024).toFixed(1)}KB`

const main = async () => {
  let raw
  try {
    raw = await readFile(STATS_PATH, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(
        `Missing ${STATS_PATH} — run \`pnpm build:only\` (or \`pnpm build\`) before this script.`
      )
      process.exit(1)
    }
    throw err
  }

  const stats = JSON.parse(raw)
  const byRoute = new Map(stats.map((entry) => [entry.route, entry]))

  const missing = SITE_ROUTES.filter((route) => !byRoute.has(route))
  if (missing.length > 0) {
    console.error(
      'Bundle budget check: expected (site) route(s) not found in route-bundle-stats.json ' +
      '(renamed or removed?):\n' +
      missing.map((route) => `  - ${route}`).join('\n')
    )
    process.exit(1)
  }

  const results = SITE_ROUTES.map((route) => {
    const bytes = byRoute.get(route).firstLoadUncompressedJsBytes
    return { route, bytes, overBudget: bytes - BUDGET_BYTES }
  })

  const overBudget = results.filter((r) => r.overBudget > 0)

  if (overBudget.length > 0) {
    console.error(
      `Bundle budget exceeded on ${overBudget.length} (site) route(s) ` +
      `(budget: ${formatKB(BUDGET_BYTES)} raw first-load JS):\n` +
      overBudget
        .map((r) => `  - ${r.route}: ${formatKB(r.bytes)} (+${formatKB(r.overBudget)} over budget)`)
        .join('\n')
    )
    process.exit(1)
  }

  console.log(`Bundle budget OK — all (site) routes under ${formatKB(BUDGET_BYTES)} raw first-load JS:`)
  for (const r of results) {
    console.log(`  - ${r.route}: ${formatKB(r.bytes)} (${formatKB(-r.overBudget)} to spare)`)
  }
}

main()
