/** Contrast of the design tokens, checked rather than trusted — this has caught two real bugs already (an invisible 2.6:1 darkness energy token, and a brand-document --ink-low claim of 4.6:1 that actually measured 4.08:1), neither catchable by the type system or the linter. */
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
// A token the light block does not redefine falls through to the dark default via the CSS cascade, so merging (rather than leaving it undefined) checks it at the value it actually renders.
const light = new Map([...dark, ...tokensIn(lightBlock)])

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

test('the accent clears 4.5:1 on its wash, in both themes — active-nav-tab styling and accent badges set text there', () => {
  for (const [themeName, theme] of [['dark', dark], ['light', light]] as const) {
    const accent = theme.get('accent')
    const wash = theme.get('accent-wash')
    assert.ok(accent !== undefined, `${themeName}: --color-accent is not defined`)
    assert.ok(wash !== undefined, `${themeName}: --color-accent-wash is not defined`)
    const ratio = contrast(accent!, wash!)
    assert.ok(
      ratio >= 4.5,
      `${themeName}: --color-accent (${accent}) on --color-accent-wash (${wash}) is ${ratio.toFixed(2)}:1`
    )
  }
})

test('the five rarity grades clear 3:1 — they are graphics', () => {
  // Checking only the dark theme is what let the light energy colours ship wrong (see the energy-icon test below) — same class of bug, checked here too.
  for (const [themeName, theme] of [['dark', dark], ['light', light]] as const) {
    for (let grade = 1; grade <= 5; grade++) {
      const colour = theme.get(`rarity-${grade}`)
      assert.ok(colour !== undefined, `${themeName}: --color-rarity-${grade} is missing`)
      for (const [surfaceName, surface] of surfaces(theme)) {
        const ratio = contrast(colour, surface)
        assert.ok(
          ratio >= 3,
          `${themeName}: --color-rarity-${grade} (${colour}) is ${ratio.toFixed(2)}:1 on ${surfaceName}`
        )
      }
    }
  }
})

/** Perceptual distance in CIE Lab: WCAG contrast measures luminance, the wrong tool here since a grey and a teal can share luminance yet look obviously different — an earlier version of this test used contrast and wrongly flagged Base against Steady. */
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
  // Colour never carries the grade alone — pips do too — but two grades that look alike make the scale useless at a glance; 20 is the threshold for "clearly a different colour".
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

test('energy icons clear 3:1, in both themes', () => {
  // Checking only the dark theme is what let six of the ten light-mode energies ship unreadable — lightning measured 1.42:1 on the light base.
  const energies = [
    'grass', 'fire', 'water', 'lightning', 'psychic',
    'fighting', 'darkness', 'metal', 'dragon', 'colorless',
  ]
  for (const [themeName, theme] of [['dark', dark], ['light', light]] as const) {
    for (const name of energies) {
      const colour = theme.get(name)
      assert.ok(colour !== undefined, `${themeName}: --color-${name} is missing`)
      for (const [surfaceName, surface] of surfaces(theme)) {
        const ratio = contrast(colour, surface)
        assert.ok(
          ratio >= 3,
          `${themeName}: --color-${name} (${colour}) is ${ratio.toFixed(2)}:1 on ${surfaceName}; invisible at that ratio`
        )
      }
    }
  }
})

test('semantic colours clear 4.5:1 in both themes — they carry validation text', () => {
  // Checking only the dark theme is what let the light amber ship at 1.84:1.
  for (const [themeName, theme] of [['dark', dark], ['light', light]] as const) {
    for (const name of ['valid', 'warn', 'invalid']) {
      const colour = theme.get(name)
      assert.ok(colour !== undefined, `${themeName}: --color-${name} is not defined`)
      for (const [surfaceName, surface] of surfaces(theme)) {
        const ratio = contrast(colour, surface)
        assert.ok(
          ratio >= 4.5,
          `${themeName}: --color-${name} (${colour}) is ${ratio.toFixed(2)}:1 on ${surfaceName}`
        )
      }
    }
  }
})
