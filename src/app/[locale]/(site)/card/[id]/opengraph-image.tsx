import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing.ts'
import { cards, cardsById, setName } from '@/lib/gameData.ts'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams (): Array<{ locale: string, id: string }> {
  return routing.locales.flatMap((locale) => cards.map((card) => ({ locale, id: card.id })))
}

/** Deliberately not fetching the card art: a large concurrent-fetch batch across ~3,900 cards is exactly what caused a real deploy failure once (see docs/decisions.md); a solid, text-only card matches the brand's dark theme and costs nothing to render at build time. */
export default async function Image ({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const card = cardsById.get(id)
  if (card == null) notFound()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // Matches viewport.themeColor in [locale]/layout.tsx; inlined because Satori cannot read the CSS custom properties in src/index.css.
          // eslint-disable-next-line no-restricted-syntax
          background: '#08090a'
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            textAlign: 'center',
            padding: '0 80px',
            // eslint-disable-next-line no-restricted-syntax
            color: '#f2f0ed'
          }}
        >
          {card.name}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            // eslint-disable-next-line no-restricted-syntax
            color: '#a2a8ae'
          }}
        >
          {setName(card.set)}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            // eslint-disable-next-line no-restricted-syntax
            color: '#f2f0ed'
          }}
        >
          Pullwise
        </div>
      </div>
    ),
    { ...size }
  )
}
