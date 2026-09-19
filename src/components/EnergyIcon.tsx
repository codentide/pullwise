/**
 * The ten TCG energy symbols, drawn here rather than sourced.
 *
 * The open icon sets that exist cover the eighteen *video game* types, which are
 * a different list: no lightning, darkness, metal or colorless, and the glyphs
 * themselves differ from the card game's. Redrawing them keeps the stroke weight
 * consistent with Icon.tsx, owes nobody a licence, and costs no request.
 *
 * Colour comes from the energy tokens in src/index.css, never from the path.
 */
export type Energy =
  | 'grass' | 'fire' | 'water' | 'lightning' | 'psychic'
  | 'fighting' | 'darkness' | 'metal' | 'dragon' | 'colorless'

/** Solid glyphs on a 24×24 grid, sized to read at 14px. */
const GLYPHS: Record<Energy, string> = {
  grass: 'M12 21c0-6 1-10 7-13-1 8-3 11-7 13zM12 21C7 19 3 15 4 7c6 1 8 6 8 14z',
  fire: 'M12 2c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 1 .5 2 1.5 2C12 8 10 6 12 2z',
  water: 'M12 2c4 5 6 8 6 11a6 6 0 01-12 0c0-3 2-6 6-11z',
  lightning: 'M14 2L5 13h5l-1 9 9-11h-5l1-9z',
  psychic: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 4a5 5 0 110 10 5 5 0 010-10z',
  fighting: 'M7 9.5C7 8.1 8.1 7 9.5 7h5C16.4 7 18 8.6 18 10.5V15a5 5 0 01-5 5h-3a5 5 0 01-5-5zM5 11.5c0-.8.7-1.5 1.5-1.5H7v4h-.5C5.7 14 5 13.3 5 12.5z',
  darkness: 'M16.5 4.2a9 9 0 100 15.6 11 11 0 010-15.6z',
  metal: 'M12 2l3 3h4l1 4-2 3 2 3-1 4h-4l-3 3-3-3H5l-1-4 2-3-2-3 1-4h4z',
  dragon: 'M12 2l7 6-3 3 3 3-7 8-7-8 3-3-3-3z',
  colorless: 'M12 2l2.6 6.5L21 9.8l-4.7 4.4 1.3 6.6L12 17.6 6.4 20.8l1.3-6.6L3 9.8l6.4-1.3z'
}

/**
 * Glyph at full strength over a dimmed disc of the same colour. That is how the
 * printed symbol reads — a coloured disc carrying a mark — inverted for a dark
 * surface, where a solid disc would shout. The opacity suffix goes through the
 * token, so the contrast test still governs the colour.
 */
const TONE: Record<Energy, string> = {
  grass: 'text-grass bg-grass/15',
  fire: 'text-fire bg-fire/15',
  water: 'text-water bg-water/15',
  lightning: 'text-lightning bg-lightning/15',
  psychic: 'text-psychic bg-psychic/15',
  fighting: 'text-fighting bg-fighting/15',
  darkness: 'text-darkness bg-darkness/15',
  metal: 'text-metal bg-metal/15',
  dragon: 'text-dragon bg-dragon/15',
  colorless: 'text-colorless bg-colorless/15'
}

export function EnergyIcon ({
  energy,
  size = 18,
  label
}: {
  energy: Energy
  /** Diameter of the disc. The glyph sits at 62% of it. */
  size?: number
  label?: string
}) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full ${TONE[energy]}`}
      style={{ width: size, height: size }}
      aria-hidden={label != null ? undefined : true}
      aria-label={label}
      role={label != null ? 'img' : undefined}
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox='0 0 24 24'
        fill='currentColor'
      >
        <path d={GLYPHS[energy]} />
      </svg>
    </span>
  )
}

export const isEnergy = (value: string): value is Energy => value in GLYPHS
