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
 * `w-full` matters here in a way it did not in the header: this element is a
 * direct flex child of the page's own `flex flex-col` shell, and `mx-auto` on
 * a flex item shrinks it to its content and centers it with auto margins
 * instead of filling the row first — the header sidesteps this because its
 * `mx-auto` lives on a plain block *inside* the flex item, not on the flex
 * item itself. Left off, the footer sat 150px off the page's own edge.
 */
export async function AppFooter () {
  const t = await getTranslations('footer')

  return (
    <footer className='mx-auto w-full max-w-[1180px] border-t border-line px-4 py-6'>
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
    </footer>
  )
}
