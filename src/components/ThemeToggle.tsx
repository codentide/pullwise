'use client'

import { useEffect, useState } from 'react'
import { Icon } from './Icon.tsx'

export type Theme = 'dark' | 'light'
const KEY = 'pullwise:theme'

/** Dark is native, light a translation; stored per browser and applied by an inline script before first paint (see ThemeScript) so it never flashes wrong; the button renders nothing until mounted since the server can't know the stored choice and rendering a guess would produce a hydration mismatch. */
export function ThemeToggle ({ label }: { label: string }) {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    const stored = document.documentElement.dataset.theme
    setTheme(stored === 'light' ? 'light' : 'dark')
  }, [])

  const toggle = (): void => {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Private mode: the choice simply does not persist.
    }
  }

  if (theme == null) return null

  return (
    <button
      onClick={toggle}
      aria-label={label}
      title={label}
      className='rounded-control p-2 text-ink-low transition-colors duration-150 hover:text-ink-high'
    >
      <Icon name={theme === 'light' ? 'moon' : 'sun'} size={14} />
    </button>
  )
}

/** Runs before the first paint so the stored theme applies with no flash — has to be inline and blocking, since a React effect runs too late. */
export function ThemeScript () {
  const script = `try{var t=localStorage.getItem('${KEY}');if(t==='light'){document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}}catch(e){}`
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
