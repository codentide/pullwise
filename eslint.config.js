import neostandard from 'neostandard'
import reactHooks from 'eslint-plugin-react-hooks'

/**
 * neostandard carries the standard style (no semicolons, single quotes, two
 * spaces) as flat config with first-class TypeScript. It also formats, so there
 * is no Prettier here: one source of truth for style.
 *
 * Everything below it is a project rule that has to break the build, not live in
 * a document nobody re-reads.
 */
export default [
  ...neostandard({ ts: true, semi: false }),

  {
    // RULE: the rules of hooks. neostandard does not ship these, and a hook
    // called inside a .map() typechecks and lints clean while being a real bug —
    // one slipped into the deck editor exactly that way.
    files: ['src/**/*.tsx', 'src/**/*.ts'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },

  {
    ignores: ['.next/**', 'dist/**', 'node_modules/**', 'src/data/**']
  },

  {
    // RULE: the domain knows nothing about React or Next.
    // This is what lets the maths run identically on the server, in the browser
    // and in plain Node tests — and what made migrating to Next cost 825 lines
    // less than it otherwise would have.
    files: ['src/lib/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['react', 'react-dom', 'next', 'next/*', 'next-intl', 'next-intl/*'],
            message: 'src/lib is the domain: it must not depend on React, Next or i18n.'
          }
        ]
      }]
    }
  },

  {
    // RULE: no raw colour in components. Every colour comes from the tokens in
    // src/index.css, which is where the verified contrast ratios live.
    files: ['src/app/**/*.tsx', 'src/components/**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b|\\brgba?\\(|\\bhsla?\\(/]',
        message: 'No raw colours in components: use a token from src/index.css.'
      }]
    }
  },

  {
    // RULE: the component set is closed. Routes compose from src/components;
    // they do not reach for raw elements. An agent that wants a button gets
    // Button, and if Button cannot do the job the answer is to extend Button —
    // which puts the change in one reviewable place instead of scattering a new
    // class string across the app.
    //
    // Only interactive elements and headings are covered: structural tags
    // (div, span, p, ul, li, section) stay free, and so does src/components
    // itself, which is where the raw elements are allowed to live.
    files: ['src/app/**/*.tsx'],
    rules: {
      'react/forbid-elements': ['error', {
        forbid: [
          { element: 'button', message: 'Use Button or Pressable from @/components.' },
          { element: 'select', message: 'Use Select from @/components.' },
          { element: 'input', message: 'Use TextInput or Checkbox from @/components.' },
          { element: 'textarea', message: 'Use Textarea from @/components.' },
          { element: 'h1', message: 'Use Heading level="page".' },
          { element: 'h2', message: 'Use Heading level="section".' },
          { element: 'h3', message: 'Use Heading level="sub".' },
          { element: 'h4', message: 'Use Heading.' },
          { element: 'h5', message: 'Use Heading.' },
          { element: 'h6', message: 'Use Heading.' }
        ]
      }]
    }
  },

  {
    // Tests run on Node and may assert on values the app never produces.
    files: ['test/**/*.ts', 'scripts/**/*.mjs'],
    rules: { 'no-restricted-syntax': 'off' }
  }
]
