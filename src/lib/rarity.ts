/**
 * The game's eleven rarities, mapped onto the brand system's five grades.
 *
 * The grades are ours, not the game's. They are named for what a card means to a
 * deck, not for how the game prints it — and the mapping is drawn from the real
 * pull rates, so the boundaries fall where the difficulty actually changes:
 *
 *   C   100% in slots 1-3        R    5% in slot 4
 *   U    90% in slot 4           RR   1.67%      AR  2.57%
 *   SR   0.5%   IM 0.22%         UR   0.04%
 *
 * When the game adds a rarity, this table is remapped and nothing visual moves.
 */
export type Grade = 1 | 2 | 3 | 4 | 5

export const GRADE_NAMES: Record<Grade, string> = {
  1: 'Base',
  2: 'Steady',
  3: 'Keen',
  4: 'Prime',
  5: 'Apex'
}

const BY_RARITY: Record<string, Grade> = {
  C: 1, // comes on its own, three guaranteed slots
  U: 1, // 90% of slot 4 — still effectively free
  R: 2, // volume: fills decks without moving the needle
  RR: 3, // the inflection point: here it starts to matter which pack you open
  AR: 3,
  SR: 4, // drives the pack count of a whole deck
  SAR: 4,
  IM: 4,
  S: 4,
  SSR: 5, // the only grade that spends the accent
  UR: 5
}

/** Unknown rarities fall to Base rather than throwing: new sets ship before we do. */
export const gradeOf = (rarity: string): Grade => BY_RARITY[rarity] ?? 1
