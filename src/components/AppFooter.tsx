import { getTranslations } from 'next-intl/server'
import { Icon } from './Icon.tsx'
import { Mark } from './Wordmark.tsx'
import pkg from '../../package.json' with { type: 'json' }

const REPO_URL = 'https://github.com/codentide/pullwise'

/** Shared by app and public pages, same reasoning as `AppHeader`; also shares its border split — outer `<footer>` carries `border-t` edge to edge, inner `div` carries `mx-auto max-w-[1180px]` — because putting both on one flex-item element (the earlier bug) shrinks it to content via auto margins, so the border rides along with the shrunken box instead of spanning the screen. */
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
              className='flex items-center gap-1 text-ink-low transition-colors duration-150 hover:text-ink-mid'
            >
              <Icon name='sourceCode' size={14} />
              GitHub
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
