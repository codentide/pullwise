import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const config: NextConfig = {
  images: {
    // 3,879 cards x 2 locales would blow through Vercel's Hobby-plan
    // image-optimization-request quota almost immediately if every thumbnail
    // went through the on-demand optimizer. `unoptimized` serves the source
    // file as-is instead — it buys next/image's CLS-prevention contract and a
    // single loading API, not smaller bytes; that stays a separate problem.
    unoptimized: true,
    // Card art lives on the Limitless CDN; it is the only external host.
    // Left configured even though `unoptimized` bypasses it — harmless, and
    // cheap insurance if this decision is ever revisited.
    remotePatterns: [
      { protocol: 'https', hostname: 'limitlesstcg.nyc3.cdn.digitaloceanspaces.com' }
    ]
  },
  experimental: {
    // Required for src/app/global-not-found.tsx to take effect at all: without
    // this flag Next silently ignores the file and falls back to its bare
    // default 404 fragment (no <html>, no lang, no styles). See PWS-012.
    globalNotFound: true
  }
}

export default withNextIntl(config)
