import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing.ts'
import { sets, setsByCode } from '@/lib/gameData.ts'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams (): Array<{ locale: string, code: string }> {
  return routing.locales.flatMap((locale) => sets.map((set) => ({ locale, code: set.code })))
}

/** Deliberately not fetching remote art: see the card page's opengraph-image for why (docs/decisions.md); a solid, text-only card matches the brand's dark theme and costs nothing at build time. */
export default async function Image ({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const set = setsByCode.get(code)
  if (set == null) notFound()

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
          // Matches viewport.themeColor in [locale]/layout.tsx — inlined because Satori cannot read the CSS custom properties in src/index.css.
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
          {set.name}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            // eslint-disable-next-line no-restricted-syntax
            color: '#a2a8ae'
          }}
        >
          {set.code}
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
