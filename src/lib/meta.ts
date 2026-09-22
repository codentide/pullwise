/** The catalogue's small metadata, on its own — importing this instead of `gameData.ts` avoids dragging the full cards dataset into a bundle that only needs `cardCount` and `latestSet`. */
import metaJson from '../data/meta.json' with { type: 'json' }

export const meta = metaJson as {
  generatedAt: string
  source: string
  cardCount: number
  latestSet: string
}
