/** The identity, from the Pullwise Brand System §03: an accent square with a slot cut on the system's 14° diagonal (a pack seen edge-on, the instant before it opens), sized to the manual's proportions; ground is `--color-mark`, not the accent, because the manual bans the accent as a large field on a light surface; the wordmark stays lowercase, never a second weight, outline, gradient or tilt. */
export function Mark ({ size = 16, className = '' }: { size?: number, className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 32 32'
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      <rect width='32' height='32' className='fill-mark' />
      <path d='M12.8 7.47 23.46 7.47 19.21 24.53 8.54 24.53Z' className='fill-base' />
    </svg>
  )
}

/** The horizontal lockup: 16px is the manual's floor for the mark, which sets the wordmark at 20px to hold the ratio it draws. */
export function Wordmark ({ className = '' }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <Mark size={16} />
      <span className='font-display text-section leading-none font-extrabold tracking-[-0.045em] text-ink-high'>
        pullwise
      </span>
    </span>
  )
}
