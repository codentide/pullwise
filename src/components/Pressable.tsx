import type { ComponentProps } from 'react'

/**
 * A clickable area with no button styling of its own.
 *
 * Most of the interactive elements in this app are not buttons in the design
 * sense — they are a card, a deck tile, a thumbnail. Making them `Button` would
 * force an appearance they should not have; leaving them as raw `<button>`
 * scatters focus and cursor handling across the codebase. This carries the
 * behaviour and none of the look.
 */
export function Pressable ({ className = '', ...props }: ComponentProps<'button'>) {
  return (
    <button
      {...props}
      className={`cursor-pointer text-left disabled:cursor-default disabled:opacity-40 ${className}`}
    />
  )
}
