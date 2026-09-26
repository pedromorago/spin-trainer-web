// ESLint flat config. Besides the quality rules, it enforces the dependencies between layers
// from docs/ARCHITECTURE.md (features → shared → domain), like ArchUnit in the API.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

const noFeatures = { group: ['**/features/**'], message: 'shared/ y domain/ no dependen de features/.' };

export default [
  { ignores: ['dist', 'coverage', 'reports', '.stryker-tmp'] },

  js.configs.recommended,
  reactHooks.configs.flat.recommended,

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  },

  {
    files: ['*.config.js', 'scripts/**/*.mjs'],
    languageOptions: { globals: globals.node }
  },

  // domain/: pure JS. No React, no I/O libraries, no browser APIs, no upper layers.
  {
    files: ['src/domain/**/*.js'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['react', 'react-*', 'react/*', '@tanstack/*', '@supabase/*'], message: 'domain/ no importa React ni librerías de I/O.' },
          { group: ['**/shared/**'], message: 'domain/ no depende de shared/.' },
          noFeatures
        ]
      }],
      'no-restricted-globals': ['error',
        ...['fetch', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'indexedDB', 'window', 'document', 'navigator']
          .map(name => ({ name, message: 'domain/ no hace I/O ni accede al navegador.' }))
      ]
    }
  },

  // shared/: never depends on features/.
  {
    files: ['src/shared/**/*.{js,jsx}'],
    rules: { 'no-restricted-imports': ['error', { patterns: [noFeatures] }] }
  },

  // shared/ui: presentation. Does not access data.
  {
    files: ['src/shared/ui/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/api', '**/api/**', '@tanstack/*'], message: 'shared/ui no importa shared/api: recibe los datos por props.' },
          noFeatures
        ]
      }]
    }
  },

  // shared/session: local state of the study session. Does not access remote data.
  {
    files: ['src/shared/session/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['**/api', '**/api/**', '@tanstack/*'], message: 'shared/session no accede a la API: el histórico son los intentos.' },
          noFeatures
        ]
      }]
    }
  },

  // features/: composition only. Data only via shared/api/index.js and shared/api/queries.js.
  {
    files: ['src/features/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['**/shared/api/*', '!**/shared/api/index*', '!**/shared/api/queries*', '**/shared/api/*/**'],
            message: 'features/ solo usa shared/api/index.js y shared/api/queries.js.'
          },
          { group: ['@tanstack/*', '@supabase/*'], message: 'features/ accede a datos y auth vía shared/.' }
        ]
      }]
    }
  }
];
