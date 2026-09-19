/**
 * Contrast of the design tokens, checked rather than trusted.
 *
 * This has now caught two real bugs. The darkness energy token shipped at 2.6:1
 * and its icon was invisible. Then the brand document declared --ink-low at
 * 4.6:1 when the value it gave measured 4.08:1 — below AA for text. Nothing in
 * the type system or the linter can catch either; only arithmetic can.
 */
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const css = readFileSync(join(import.meta.dirname, '..', 'src', 'index.css'), 'utf8')

/** Tokens from the default (dark) block, and from the light theme separately. */
function tokensIn (source: string): Map<string, string> {
  const found = new Map<string, string>()
  for (const match of source.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) {
    found.set(match[1]!, match[2]!)
  }
  return found
}

const lightBlock = /\[data-theme='light'\]\s*\{([\s\S]*?)\n {2}\}/.exec(css)?.[1] ?? ''
const dark = tokensIn(css.replace(lightBlock, ''))
const light = tokensIn(lightBlock)

function luminance (hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!
}

function contrast (a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

/** Every surface text can sit on, per theme. */
const surfaces = (theme: Map<string, string>): Array<[string, string]> =>
  (['base', 'raised', 'overlay'] as const)
    .map((name) => [name, theme.get(name)] as const)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)

test('the dark theme defines every token the system depends on', () => {
  const required = [
    'base', 'raised', 'overlay', 'line', 'ink-high', 'ink-mid', 'ink-low',
    'accent', 'accent-ink', 'valid', 'warn', 'invalid',
    'rarity-1', 'rarity-2', 'rarity-3', 'rarity-4', 'rarity-5',
  ]
  for (const name of required) {
    assert.ok(dark.has(name), `--color-${name} is missing from src/index.css`)
  }
})

test('ink clears 4.5:1 on every surface, in both themes', () => {
  for (const [themeName, theme] of [['dark', dark], ['light', light]] as const) {
    for (const ink of ['ink-high', 'ink-mid', 'ink-low']) {
      const colour = theme.get(ink)
      if (colour === undefined) continue
      for (const [surfaceName, surface] of surfaces(theme)) {
        const ratio = contrast(colour, surface)
        assert.ok(
          ratio >= 4.5,
          `${themeName}: --color-${ink} (${colour}) is ${ratio.toFixed(2)}:1 on ${surfaceName}; text needs 4.5:1`
        )
      }
    }
  }
})

test('text on the accent clears 4.5:1, in both themes', () => {
  for (const [themeName, theme] of [['dark', dark], ['light', light]] as const) {
    const accent = theme.get('accent')
    const ink = theme.get('accent-ink')
    if (accent === undefined || ink === undefined) continue
    const ratio = contrast(ink, accent)
    assert.ok(
      ratio >= 4.5,
      `${themeName}: text on the accent is ${ratio.toFixed(2)}:1, needs 4.5:1`
    )
  }
})

test('the five rarity grades clear 3:1 — they are graphics', () => {
  for (let grade = 1; grade <= 5; grade++) {
    const colour = dark.get(`rarity-${grade}`)
    assert.ok(colour !== undefined, `--color-rarity-${grade} is missing`)
    const ratio = contrast(colour, dark.get('base')!)
    assert.ok(ratio >= 3, `--color-rarity-${grade} (${colour}) is ${ratio.toFixed(2)}:1`)
  }
})

/**
 * Perceptual distance in CIE Lab. WCAG contrast measures luminance, which is the
 * wrong tool here: a grey and a teal can share a luminance and still be obviously
 * different colours. An earlier version of this test used contrast and wrongly
 * flagged Base against Steady.
 */
function lab (hex: string): [number, number, number] {
  const srgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = srgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const x = (r! * 0.4124 + g! * 0.3576 + b! * 0.1805) / 0.95047
  const y = r! * 0.2126 + g! * 0.7152 + b! * 0.0722
  const z = (r! * 0.0193 + g! * 0.1192 + b! * 0.9505) / 1.08883
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

const deltaE = (a: string, b: string): number =>
  Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]!))

test('the five rarity grades are perceptually distinct from one another', () => {
  // Colour never carries the grade alone — pips do too — but two grades that look
  // alike make the scale useless at a glance. 20 is the threshold for "clearly
  // a different colour".
  for (let a = 1; a <= 5; a++) {
    for (let b = a + 1; b <= 5; b++) {
      const distance = deltaE(dark.get(`rarity-${a}`)!, dark.get(`rarity-${b}`)!)
      assert.ok(
        distance >= 20,
        `rarity-${a} and rarity-${b} are only ${distance.toFixed(0)} apart in Lab; too close to tell`
      )
    }
  }
})

test('energy icons clear 3:1 on the base surface', () => {
  const energies = [
    'grass', 'fire', 'water', 'lightning', 'psychic',
    'fighting', 'darkness', 'metal', 'dragon', 'colorless',
  ]
  for (const name of energies) {
    const colour = dark.get(name)
    assert.ok(colour !== undefined, `--color-${name} is missing`)
    const ratio = contrast(colour, dark.get('base')!)
    assert.ok(ratio >= 3, `--color-${name} (${colour}) is ${ratio.toFixed(2)}:1; invisible at that ratio`)
  }
})

test('semantic colours clear 4.5:1 — they carry validation text', () => {
  for (const name of ['valid', 'warn', 'invalid']) {
    const ratio = contrast(dark.get(name)!, dark.get('base')!)
    assert.ok(ratio >= 4.5, `--color-${name} is ${ratio.toFixed(2)}:1`)
  }
})
