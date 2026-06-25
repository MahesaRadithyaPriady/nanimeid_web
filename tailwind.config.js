/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        // default sm is 640px, md is 768px, lg is 1024px, xl is 1280px, 2xl is 1536px
      },
      colors: {
        primary: {
          light: '#ff99e6',
          DEFAULT: '#ff66cd',
          deep: '#ff66be',
        },
        muted: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        bg: {
          base: 'rgb(var(--color-bg-base) / <alpha-value>)',
          surface: 'rgb(var(--color-bg-surface) / <alpha-value>)',
          elevated: 'rgb(var(--color-bg-elevated) / <alpha-value>)',
          sidebar: 'rgb(var(--color-bg-sidebar) / <alpha-value>)',
          active: 'rgb(var(--color-bg-active) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--color-border) / <alpha-value>)',
          accent: 'rgb(var(--color-border-accent) / <alpha-value>)',
        },
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1.1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.6rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.6rem' }],
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(255, 102, 205, 0.35)',
        'glow-lg': '0 8px 32px rgba(255, 102, 205, 0.25)',
      },
    },
  },
  plugins: [],
}
