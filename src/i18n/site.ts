import { routing } from './routing.ts'

/**
 * Not src/lib/: this depends on routing.ts, which is next-intl-coupled, and
 * src/lib/ must stay framework-free (enforced by test/architecture.test.ts).
 */
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pullwise.app'

/**
 * A `languages`-shaped map for a locale-less path (e.g. `/card/B1a-080`),
 * including `x-default` for the locale-free / unmatched-language case. Used
 * for both `alternates.languages` on a page's own metadata and, combined with
 * `BASE_URL`, for the sitemap's cross-locale links.
 */
export function localeAlternates (path: string): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((locale) => [locale, `/${locale}${path}`])),
    'x-default': `/en${path}`
  }
}
