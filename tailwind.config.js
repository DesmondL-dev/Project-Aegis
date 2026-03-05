/** @type {import('tailwindcss').Config} */
export default {
  // Scopes the Tailwind compiler to physical directories to optimize build speed
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Enable class-based dark mode for the Dynamic Theme Engine
  darkMode: 'class',
  theme: {
    extend: {
      // Semantic color adapter layer.
      // Binds Tailwind utility classes (e.g., `bg-primary`, `text-muted`)
      // to runtime CSS variables. The entire utility surface becomes
      // tenant-aware with zero build-time recompilation.
      colors: {
        primary:            'var(--color-primary)',
        'primary-hover':    'var(--color-primary-hover)',
        surface:            'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        background:         'var(--color-background)',
        border:             'var(--color-border)',
        'border-focus':     'var(--color-border-focus)',
        'text-primary':     'var(--color-text-primary)',
        'text-muted':       'var(--color-text-muted)',
      },
    },
  },
  plugins: [],
}
