/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        'surface-bright': 'var(--surface-bright)',
        'surface-lowest': 'var(--surface-container-lowest)',
        'surface-low': 'var(--surface-container-low)',
        'surface-container': 'var(--surface-container)',
        'surface-high': 'var(--surface-container-high)',
        'surface-highest': 'var(--surface-container-highest)',
        
        primary: 'var(--primary)',
        'primary-container': 'var(--primary-container)',
        secondary: 'var(--secondary)',
        tertiary: 'var(--tertiary)',
        
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        error: 'var(--error)',
        
        // Brand/text mapping for fallback continuity
        brand: 'var(--primary)', 
        text: 'var(--on-surface)',
        muted: 'var(--on-surface-variant)',
        border: 'var(--outline-variant)',
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
      },
      boxShadow: {
        // Ambient soft shadow: diffuse 24px-40px, 4-6% opacity with #1b1c1c tint
        ambient: '0 8px 24px rgba(27, 28, 28, 0.05)',
        'ambient-lg': '0 24px 40px rgba(27, 28, 28, 0.06)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
