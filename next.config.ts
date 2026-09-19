import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from 'next'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const config: NextConfig = {
  images: {
    // Card art lives on the Limitless CDN; it is the only external host.
    remotePatterns: [
      { protocol: 'https', hostname: 'limitlesstcg.nyc3.cdn.digitaloceanspaces.com' }
    ]
  }
}

export default withNextIntl(config)
