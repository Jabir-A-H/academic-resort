/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--bg-h) var(--bg-s) var(--bg-l) / <alpha-value>)',
        card: 'hsl(var(--card-h) var(--card-s) var(--card-l) / <alpha-value>)',
        muted: 'hsl(var(--muted-h) var(--muted-s) var(--muted-l) / <alpha-value>)',
        text: 'hsl(var(--text-h) var(--text-s) var(--text-l) / <alpha-value>)',
        brand: 'hsl(var(--brand-h) var(--brand-s) var(--brand-l) / <alpha-value>)',
        primary: 'hsl(var(--brand-h) var(--brand-s) var(--brand-l) / <alpha-value>)',
        border: 'hsl(var(--border-h) var(--border-s) var(--border-l) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'calc(var(--radius-md) - 4px)',
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
      },
      backdropBlur: {
        xs: '2px',
        glass: 'var(--glass-blur)',
      },
    },
  },
  plugins: [],
}
