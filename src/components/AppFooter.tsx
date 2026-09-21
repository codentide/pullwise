import { getTranslations } from 'next-intl/server'
import { Icon } from './Icon.tsx'
import { Mark } from './Wordmark.tsx'
import pkg from '../../package.json' with { type: 'json' }

const REPO_URL = 'https://github.com/codentide/pullwise'

/**
 * The one footer for the whole product — the app and the public pages both
 * use it, same reasoning as the shared header: it is the same product, and a
 * crawler landing on a card page deserves the same "what is this, who made
 * it, where's the code" as someone deep in the deck editor.
 *
 * The border needs its own full-width layer, same split as `AppHeader`: the
 * outer `<footer>` carries the `border-t` edge to edge, and an inner `div`
 * holds the `mx-auto max-w-[1180px]` that lines its content up with the page.
 * Putting both on one element was the earlier bug — `mx-auto` on a flex item
 * (this element is a direct child of the page's `flex flex-col` shell)
 * shrinks it to its content and centers it with auto margins instead of
 * filling the row, so the border rode along with the shrunken box instead of
 * spanning the screen.
 */
export async function AppFooter () {
  const t = await getTranslations('footer')

  return (
    <footer className='border-t border-line'>
      <div className='mx-auto max-w-[1180px] px-4 py-6'>
        <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
          <div className='flex items-center gap-2'>
            <Mark size={14} />
            <span className='font-mono text-label text-ink-low'>
              pullwise <span className='tnum'>v{pkg.version}</span>
            </span>
          </div>
          <div className='flex items-center gap-3 text-label text-ink-low'>
            <span>{t('by', { name: 'Marco Del Boccio' })}</span>
            <a
              href={REPO_URL}
              target='_blank'
              rel='noopener noreferrer'
              aria-label={t('sourceCode')}
              title={t('sourceCode')}
              className='text-ink-low transition-colors duration-150 hover:text-ink-mid'
            >
              <Icon name='sourceCode' size={14} />
            </a>
          </div>
        </div>
        <p className='mt-4 max-w-prose text-label leading-relaxed text-ink-low'>
          {t('disclaimer')}
        </p>
      </div>
    </footer>
  )
}
