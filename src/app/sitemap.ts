import type { MetadataRoute } from 'next'
import { allPacks, cards, sets } from '@/lib/gameData.ts'
import { routing } from '@/i18n/routing.ts'
import { BASE_URL } from '@/i18n/site.ts'

/**
 * The ~3,900 static pages per locale are the reason this file exists: every card
 * is a query someone types into a search engine ("pikachu ex which pack").
 * Each entry declares its alternate language so neither version competes with
 * the other.
 */
export default function sitemap (): MetadataRoute.Sitemap {
  const paths = [
    { path: '', priority: 1 },
    ...sets.map((set) => ({ path: `/set/${set.code}`, priority: 0.8 })),
    ...allPacks.map((pack) => ({
      path: `/pack/${pack.set}/${encodeURIComponent(pack.pack)}`,
      priority: 0.8
    })),
    ...cards.map((card) => ({ path: `/card/${card.id}`, priority: 0.6 }))
  ]

  return paths.flatMap(({ path, priority }) =>
    routing.locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((other) => [other, `${BASE_URL}/${other}${path}`])
        )
      }
    }))
  )
}
