import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing.ts'
import { allPacks, setName } from '@/lib/gameData.ts'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export function generateStaticParams (): Array<{ locale: string, set: string, name: string }> {
  // Same reasoning as the page's generateStaticParams: the raw pack name, not
  // encodeURIComponent(pack.pack) — Next matches this list against the
  // decoded route segment.
  return routing.locales.flatMap((locale) =>
    allPacks.map((pack) => ({ locale, set: pack.set, name: pack.pack }))
  )
}

/**
 * Deliberately not fetching remote art: see the card page's opengraph-image
 * for why (docs/decisions.md). A solid, text-only card matches the brand's
 * dark theme and costs nothing at build time.
 */
export default async function Image ({ params }: { params: Promise<{ set: string, name: string }> }) {
  const { set, name } = await params
  const packName = decodeURIComponent(name)
  const pack = allPacks.find((p) => p.set === set && p.pack === packName) ?? null
  if (pack == null) notFound()

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
          // Matches viewport.themeColor in [locale]/layout.tsx — inlined
          // because Satori cannot read the CSS custom properties in
          // src/index.css.
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
          {pack.pack}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            // eslint-disable-next-line no-restricted-syntax
            color: '#a2a8ae'
          }}
        >
          {setName(pack.set)}
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
