import { useTranslations } from 'next-intl'
import { EnergyIcon, isEnergy } from '@/components/EnergyIcon.tsx'
import { Select } from '@/components/Select.tsx'
import { SearchField, Checkbox } from '@/components/Field.tsx'
import { Chip } from '@/components/Indicators.tsx'
import { ELEMENTS, RARITIES, setsNewestFirst, type Filters } from '@/lib/filters.ts'

export function CardFilters ({
  value,
  onChange,
  showKnownToggle = false,
  resultCount
}: {
  value: Filters
  onChange: (next: Filters) => void
  showKnownToggle?: boolean
  resultCount: number
}) {
  const t = useTranslations('filters')
  const set = <K extends keyof Filters>(key: K, next: Filters[K]): void =>
    onChange({ ...value, [key]: next })

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <SearchField
        pad='sm'
        type='search'
        value={value.text}
        onChange={(event) => set('text', event.target.value)}
        placeholder={t('search')}
        className='min-w-[12rem] flex-1'
      />

      <Select
        value={value.set}
        onChange={(next) => set('set', next)}
        aria-label={t('allSets')}
        placeholder={t('allSets')}
        options={[
          { value: '', label: t('allSets') },
          ...setsNewestFirst.map((s) => ({ value: s.code, label: s.name }))
        ]}
      />

      <Select
        value={value.kind}
        onChange={(next) => set('kind', next as Filters['kind'])}
        aria-label={t('allKinds')}
        placeholder={t('allKinds')}
        options={[
          { value: '', label: t('allKinds') },
          { value: 'pokemon', label: t('onlyPokemon') },
          { value: 'trainer', label: t('onlyTrainer') }
        ]}
      />

      <Select
        value={value.rarity}
        onChange={(next) => set('rarity', next)}
        aria-label={t('allRarities')}
        placeholder={t('allRarities')}
        options={[
          { value: '', label: t('allRarities') },
          ...RARITIES.map((rarity) => ({ value: rarity, label: rarity }))
        ]}
      />

      {showKnownToggle && (
        <Checkbox
          checked={value.onlyKnown}
          onChange={(next) => set('onlyKnown', next)}
          label={t('onlyKnown')}
        />
      )}

      <span className='tnum ml-auto text-label text-ink-low'>{resultCount}</span>

      <EnergyFilter value={value.element} onChange={(next) => set('element', next)} />
    </div>
  )
}

/** Energies are chips rather than a dropdown: there are ten, they're recognised by symbol far faster than by name, and they read as a single row. */
function EnergyFilter ({ value, onChange }: { value: string, onChange: (next: string) => void }) {
  const t = useTranslations('filters')
  const names = useTranslations('energies')

  return (
    <div className='flex w-full flex-wrap items-center gap-1'>
      <Chip pressed={value === ''} onClick={() => onChange('')} className='px-2'>
        {t('allElements')}
      </Chip>
      {ELEMENTS.filter(isEnergy).map((energy) => (
        <Chip
          key={energy}
          pressed={value === energy}
          onClick={() => onChange(value === energy ? '' : energy)}
          title={names(energy)}
          className='p-1'
        >
          <EnergyIcon energy={energy} label={names(energy)} size={20} />
        </Chip>
      ))}
    </div>
  )
}
