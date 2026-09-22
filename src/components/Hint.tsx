'use client'

import { useState, type ReactNode } from 'react'
import { Icon } from './Icon.tsx'
import { Pressable } from './Pressable.tsx'

/** Not a Radix primitive — the brand system reserves Radix for Select/Dialog/Checkbox and this hover panel doesn't need a fourth; opens on hover, toggles on click/tap for no-hover devices; opens downward and right-aligned because its first caller (pack ranking's "OPEN THIS" header) sits at a right edge inside `overflow-hidden` — revisit once a second caller needs otherwise. */
export function Hint ({ label, children }: { label: string, children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <span className='group/hint relative inline-flex'>
      <Pressable
        aria-label={label}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => setOpen(false)}
        className='text-ink-low transition-colors duration-150 hover:text-ink-mid'
      >
        <Icon name='hint' size={13} />
      </Pressable>
      <span
        role='tooltip'
        className={`pointer-events-none absolute right-0 top-full z-10 mt-2 w-56 rounded-control border border-line-strong bg-raised p-2 text-left text-label leading-relaxed text-ink-mid transition-opacity duration-150 ${
          open ? 'opacity-100' : 'opacity-0 group-hover/hint:opacity-100'
        }`}
      >
        {children}
      </span>
    </span>
  )
}
