/** Only exists because Next requires a layout above the [locale] segment — the real html/body shell lives in [locale]/layout.tsx, where the language is known. */
export default function RootLayout ({ children }: { children: React.ReactNode }) {
  return children
}
