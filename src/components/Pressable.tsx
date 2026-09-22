import type { ComponentProps } from 'react'

/** A clickable area with a button's behaviour but none of its look (for cards, tiles, thumbnails); `appearance-none` is required because Tailwind's preflight keeps `appearance: button` for iOS Safari's radius styling, but on macOS that paints the OS's own smaller pushable capsule underneath, showing dark margins around a full-width hover background. `ref` passes straight through — React 19 supports it as an ordinary prop on a function component, no `forwardRef` needed — for callers that need to measure the rendered button (a floating tooltip positioning itself against it, say). */
export function Pressable ({ className = '', ref, ...props }: ComponentProps<'button'>) {
  return (
    <button
      ref={ref}
      {...props}
      className={`appearance-none cursor-pointer text-left disabled:cursor-default disabled:opacity-40 ${className}`}
    />
  )
}
