'use client'

import { Heading } from '@/components/Heading.tsx'
import { Button } from '@/components/Button.tsx'
import '@/index.css'

/**
 * The last-resort error boundary: it catches an uncaught exception thrown
 * before or during the root layout itself, so — like global-not-found.tsx —
 * it replaces [locale]/layout.tsx entirely and must declare its own <html>
 * and <body>, hardcoded to English since no locale can be assumed to have
 * resolved. Error boundaries must be Client Components.
 *
 * The recovery prop is `retry` (Next 16; `reset` was the pre-16 name and is
 * still exported for backwards compatibility, but retry is what App Router
 * error boundaries receive here).
 */

export default function GlobalError ({
  error,
  retry
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang='en'>
      <body className='flex min-h-screen items-center justify-center bg-base px-6 text-ink-high'>
        <div className='max-w-md text-center'>
          <p className='font-mono text-label uppercase tracking-[0.14em] text-ink-low'>Error</p>
          <Heading level='title' className='mt-2'>Something went wrong</Heading>
          <p className='mt-4 text-body text-ink-mid'>
            An unexpected error occurred{error.digest ? ` (ref: ${error.digest})` : ''}.
          </p>
          <Button onClick={() => retry()} className='mt-6'>Try again</Button>
          <div className='mt-4'>
            <a href='/en' className='text-label text-accent underline-offset-4 hover:underline'>
              Back to Pullwise
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
