
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
      },
      colors: {
        'gc-bg': '#0B0F14',       // deep iOS-like dark
        'gc-surface': '#0F141A',  // surfaces
        'gc-ink': '#E6EAF2',
        'gc-subtle': '#9CA3AF',
        'gc-accent': '#0A84FF',   // iOS blue
        'gc-border': 'rgba(255,255,255,0.08)'
      },
      borderRadius: { '2xl': '1.25rem' },
      boxShadow: {
        'elev': '0 6px 30px rgba(0,0,0,0.35)',
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
