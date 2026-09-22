import Link from 'next/link'
import type { Metadata } from 'next'
import { Heading } from '@/components/Heading.tsx'
import '@/index.css'

/**
 * The global 404: what Next renders when a URL matches no route at all,
 * before any [locale] segment resolves. It replaces the root layout entirely
 * (see src/app/layout.tsx), so nothing from [locale]/layout.tsx — html lang,
 * fonts, theme, next-intl — reaches it. It has to declare its own <html> and
 * <body> and pull in its own styles, and it does so deliberately in English
 * only: no locale is known at this point to pick anything else.
 *
 * Requires experimental.globalNotFound in next.config.ts — without that flag
 * this file is inert and Next falls back to its bare default 404 fragment.
 */

export const metadata: Metadata = {
  title: 'Not found · Pullwise',
  description: 'The page you are looking for does not exist.'
}

export default function GlobalNotFound () {
  return (
    <html lang='en'>
      <body className='flex min-h-screen items-center justify-center bg-base px-6 text-ink-high'>
        <div className='max-w-md text-center'>
          <p className='font-mono text-label uppercase tracking-[0.14em] text-ink-low'>404</p>
          <Heading level='title' className='mt-2'>Page not found</Heading>
          <p className='mt-4 text-body text-ink-mid'>
            The page you were looking for doesn&apos;t exist, or has moved.
          </p>
          <Link
            href='/en'
            className='mt-6 inline-flex items-center justify-center rounded-control bg-accent px-3 py-2 text-meta font-medium text-accent-ink hover:opacity-90'
          >
            Back to Pullwise
          </Link>
        </div>
      </body>
    </html>
  )
}
