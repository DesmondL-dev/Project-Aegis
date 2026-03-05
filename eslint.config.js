import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
    ],
    plugins: {
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Engine rules for enterprise-grade predictability and preventing memory leaks
      '@typescript-eslint/no-explicit-any': 'error', // Enforce strict type definitions; eliminate unpredictable payload structures
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }], // Prevent memory bloat and dead code accumulation
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Protect main thread performance by preventing accidental DOM I/O blocking
      'prefer-const': 'error', // Enforce immutability by default for predictable state machines
      'eqeqeq': ['error', 'always'], // Eliminate implicit type coercion vulnerabilities
    },
  },
])