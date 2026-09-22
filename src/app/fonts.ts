import { Archivo, Bricolage_Grotesque as BricolageGrotesque, JetBrains_Mono as JetBrainsMono } from 'next/font/google'

/** The three families of the brand system, self-hosted by next/font — no external request, no flash of unstyled text, and fallback metrics adjust automatically so the layout doesn't shift when the real face arrives. */

/** Display — headlines, hero figures, large pack names. Never below 20px. */
export const display = BricolageGrotesque({
  subsets: ['latin'],
  weight: ['600', '800'],
  variable: '--font-display-loaded',
  display: 'swap'
})

/** Interface — body, buttons, forms, navigation. Editorial grotesque, high x-height. */
export const sans = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans-loaded',
  display: 'swap'
})

/** Data — tabular figures, small caps labels, card IDs, English set and pack names. */
export const mono = JetBrainsMono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono-loaded',
  display: 'swap'
})

export const fontVariables = `${display.variable} ${sans.variable} ${mono.variable}`
