/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#090B0F',
        coal: '#13161C',
        graphite: '#1B2028',
        steel: '#2A3039',
        gold: { DEFAULT: '#D4AF37', bright: '#F5D778', deep: '#9C7C1E' },
        snow: '#F7F7F8',
        silver: '#9299A5',
        emerald: '#31C48D',
        ruby: '#E5484D',
      },
      fontFamily: {
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { xl: '10px', '2xl': '14px' },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
        lift: '0 18px 40px -18px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.35)',
      },
    },
  },
  plugins: [],
}
