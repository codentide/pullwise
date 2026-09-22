/** The ten TCG energy symbols — the real printed artwork, not a redrawn approximation. Hand-drawn glyphs were tried first (three separate passes, each fixing what the last one got wrong) and never read as anything but a rough sketch of the real thing once seen side by side with it. Pulled once from Bulbagarden Archives into `public/energy/` rather than hotlinked, same posture already taken for booster art (`sync-packs.mjs`) and the whole card catalogue (Limitless): this is a fan project already built entirely on official assets it has no licence to, disclosed in the footer, not a new category of risk. Each PNG already carries its own colour and circular badge, so this component draws no disc of its own — unlike the glyphs it replaces. */
export type Energy =
  | 'grass' | 'fire' | 'water' | 'lightning' | 'psychic'
  | 'fighting' | 'darkness' | 'metal' | 'dragon' | 'colorless'

const ENERGIES: readonly Energy[] = [
  'grass', 'fire', 'water', 'lightning', 'psychic',
  'fighting', 'darkness', 'metal', 'dragon', 'colorless'
]

export function EnergyIcon ({
  energy,
  size = 18,
  label
}: {
  energy: Energy
  size?: number
  label?: string
}) {
  return (
    <img
      src={`/energy/${energy}.png`}
      width={size}
      height={size}
      alt={label ?? ''}
      className='inline-block shrink-0'
    />
  )
}

export const isEnergy = (value: string): value is Energy => (ENERGIES as string[]).includes(value)
