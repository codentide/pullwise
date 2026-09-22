import { routing } from './routing.ts'

/** Not src/lib/: this depends on routing.ts, which is next-intl-coupled, and src/lib/ must stay framework-free (enforced by test/architecture.test.ts). */
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pullwise.app'

/** A `languages`-shaped map (with `x-default`) for a locale-less path — used for both a page's `alternates.languages` and, with `BASE_URL`, the sitemap's cross-locale links. */
export function localeAlternates (path: string): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, `/${locale}${path}`])),
    'x-default': `/en${path}`
  }
}
