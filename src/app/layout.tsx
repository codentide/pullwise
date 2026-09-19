/**
 * The root layout only exists because Next requires one above the [locale]
 * segment. The real html/body shell lives in [locale]/layout.tsx, which is where
 * the language is known.
 */
export default function RootLayout ({ children }: { children: React.ReactNode }) {
  return children
}
