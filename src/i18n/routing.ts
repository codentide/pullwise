import { defineRouting } from 'next-intl/routing'

/**
 * Both locales carry a prefix (/en, /es). It costs a redirect at the root but
 * keeps every page unambiguous for crawlers, with no duplicate content between
 * a bare path and a prefixed one.
 */
export const routing = defineRouting({
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: 'always'
})

export type Locale = (typeof routing.locales)[number]
