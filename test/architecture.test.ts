/**
 * Architecture rules, enforced rather than documented.
 *
 * These exist because the project is largely written by agents: a convention
 * that does not break the build is a suggestion, and suggestions drift. Each of
 * these caught a real design decision worth keeping.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'

const SRC = resolve(import.meta.dirname, '..', 'src')

function walk (dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.tsx?$/.test(entry) ? [full] : []
  })
}

const files = walk(SRC)

/** Every relative or aliased import in a file, as a path relative to src/. */
function importsOf (file: string): string[] {
  const source = readFileSync(file, 'utf8')
  const found: string[] = []
  for (const match of source.matchAll(/from '([^']+)'/g)) {
    const spec = match[1]!
    if (spec.startsWith('@/')) found.push(spec.slice(2))
    else if (spec.startsWith('.')) found.push(relative(SRC, resolve(dirname(file), spec)))
  }
  return found
}

test('the domain does not depend on React, Next or i18n', () => {
  const forbidden = /^(react|react-dom|next|next-intl)(\/|$)/
  for (const file of files.filter((f) => f.includes('/lib/'))) {
    const source = readFileSync(file, 'utf8')
    for (const match of source.matchAll(/from '([^']+)'/g)) {
      assert.ok(
        !forbidden.test(match[1]!),
        `${relative(SRC, file)} imports ${match[1]!}; src/lib must stay framework-free`
      )
    }
  }
})

test('colocated components are not imported from another route', () => {
  // A file under some/route/_components belongs to that route. If a second route
  // needs it, it moves up to src/components — it does not get reached into.
  for (const file of files) {
    const importer = relative(SRC, file)
    for (const target of importsOf(file)) {
      const marker = target.indexOf('_components/')
      if (marker === -1) continue
      const owner = target.slice(0, marker)
      assert.ok(
        importer.startsWith(owner),
        `${importer} reaches into ${target}. Colocated components belong to their route: ` +
          'move it to src/components/ if a second route needs it.'
      )
    }
  }
})

test('generated data is never edited by hand', () => {
  // src/data/ is the output of `pnpm sync:data`. A hand edit there silently
  // disagrees with the upstream source and survives until someone regenerates.
  const script = readFileSync(join(SRC, '..', 'scripts', 'sync-data.mjs'), 'utf8')
  const generated = ['cards', 'sets', 'pullRates', 'poolCounts', 'rateFallbacks', 'meta']
  for (const name of generated) {
    assert.ok(
      script.includes(name),
      `src/data/${name}.json is not produced by sync-data.mjs; either generate it or remove it`
    )
  }
})
