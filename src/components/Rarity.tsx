import { useTranslations } from 'next-intl'
import { gradeOf, type Grade } from '@/lib/rarity.ts'

/** Rarity is always doubly encoded: colour **and** pips, never colour alone — neither for colour blindness nor for 24px thumbnails, where a hue is a guess. */
const TONE: Record<Grade, string> = {
  1: 'text-rarity-1',
  2: 'text-rarity-2',
  3: 'text-rarity-3',
  4: 'text-rarity-4',
  5: 'text-rarity-5'
}

export function RarityPips ({ rarity, showName = false, className = '' }: { rarity: string, showName?: boolean, className?: string }) {
  const grade = gradeOf(rarity)
  const t = useTranslations('grades')
  const name = t(String(grade))

  return (
    <span
      className={`inline-flex items-center gap-1 ${TONE[grade]} ${className}`}
      title={`${name} · ${rarity}`}
    >
      <span className='flex items-center gap-px' aria-hidden>
        {([1, 2, 3, 4, 5] as Grade[]).map((pip) => (
          <span
            key={pip}
            className={`block size-1 ${pip <= grade ? 'bg-current' : 'bg-current opacity-20'}`}
          />
        ))}
      </span>
      {showName && <span className='font-mono text-label'>{name}</span>}
      <span className='sr-only'>{name}</span>
    </span>
  )
}
