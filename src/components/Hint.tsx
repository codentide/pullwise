'use client'

import { useState, type ReactNode } from 'react'
import { Icon } from './Icon.tsx'
import { Pressable } from './Pressable.tsx'

/**
 * A small "why" attached to a label, not a Radix primitive — the brand system
 * reserves Radix for Select, Dialog and Checkbox, and a hover panel this
 * simple does not need a fourth. Opens on hover for a mouse, and toggles on
 * click/tap so it also works with no hover at all.
 *
 * Opens downward. Its first home — the pack ranking's "OPEN THIS" header — sits
 * inside a section with `overflow-hidden`; opening upward, as a tooltip
 * usually does, put the panel outside that box and clipped it to nothing.
 */
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
        className={`pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-control border border-line-strong bg-raised p-2 text-left text-label leading-relaxed text-ink-mid transition-opacity duration-150 ${
          open ? 'opacity-100' : 'opacity-0 group-hover/hint:opacity-100'
        }`}
      >
        {children}
      </span>
    </span>
  )
}
