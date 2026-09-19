#!/usr/bin/env node
/**
 * Downloads booster artwork for every pack.
 *
 * The game's booster art is not in any card API: Limitless serves cards only and
 * TCGdex's set logos stop at B2. Bulbagarden Archives has all of it, with
 * consistent filenames, so this pulls it once into public/packs/ rather than
 * hotlinking someone else's server on every page view — 28 files, not 3,879.
 *
 * Run by hand when a set ships (`pnpm sync:packs`), like sync-data.
 */
import { writeFile, mkdir, readFile, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'packs')
const API = 'https://archives.bulbagarden.net/w/api.php'

/** Bulbagarden names single-pack sets without the pack name. */
const fileNameFor = (set, pack, packCount) =>
  packCount === 1 ? `${set} Booster EN.png` : `${set} Booster ${pack} EN.png`

/** What we save it as: stable, lowercase, no spaces. */
export const slugFor = (set, pack) =>
  `${set}-${pack.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/-+$/, '')

const main = async () => {
  const sets = JSON.parse(await readFile(join(ROOT, 'src/data/sets.json'), 'utf8'))
  const wanted = sets
    .filter((set) => set.obtainableFromPacks)
    .flatMap((set) =>
      set.packs.map((pack) => ({
        set: set.code,
        pack,
        file: fileNameFor(set.code, pack, set.packs.length),
        slug: slugFor(set.code, pack)
      }))
    )

  await mkdir(OUT, { recursive: true })

  // One API call resolves every URL; downloading is what takes the time.
  const titles = wanted.map((entry) => `File:${entry.file}`).join('|')
  const query = new URLSearchParams({
    action: 'query', titles, prop: 'imageinfo', iiprop: 'url', format: 'json'
  })
  const res = await fetch(`${API}?${query}`)
  const pages = Object.values((await res.json()).query.pages)

  const urlByTitle = new Map(
    pages
      .filter((page) => page.imageinfo?.[0]?.url)
      .map((page) => [page.title.replace('File:', ''), page.imageinfo[0].url])
  )

  let saved = 0
  let skipped = 0
  const missing = []

  for (const entry of wanted) {
    const target = join(OUT, `${entry.slug}.webp`)
    if (existsSync(target)) { skipped++; continue }

    const url = urlByTitle.get(entry.file)
    if (url === undefined) { missing.push(`${entry.set}/${entry.pack}`); continue }

    const image = await fetch(url, { headers: { 'User-Agent': 'pullwise/1.0 (fan project)' } })
    if (!image.ok) { missing.push(`${entry.set}/${entry.pack}`); continue }

    const png = `${target}.tmp.png`
    await writeFile(png, Buffer.from(await image.arrayBuffer()))

    // The originals are ~160 KB of PNG for something rendered at 64-120px.
    // cwebp comes from Homebrew, which this machine already has.
    await run('cwebp', ['-q', '82', '-resize', '320', '0', png, '-o', target, '-quiet'])
    await unlink(png)
    saved++
  }

  console.log(`✓ ${saved} descargadas · ${skipped} ya estaban · ${missing.length} sin arte`)
  if (missing.length > 0) console.log(`  faltan: ${missing.join(', ')}`)
}

main().catch((error) => { console.error(error); process.exit(1) })
