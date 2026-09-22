/** The game's eleven rarities mapped onto the brand system's own five grades — named for what a card means to a deck, not how the game prints it — with boundaries drawn from real pull rates (C/U ~100%/90% in slots 1-4, R 5%, RR/AR ~1.67%/2.57%, SR/IM ~0.5%/0.22%, UR 0.04%), so a new rarity remaps the table without moving anything visual. */
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
