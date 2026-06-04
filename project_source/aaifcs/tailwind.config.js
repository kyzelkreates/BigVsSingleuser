/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme'

export default {
  darkMode: 'class',
  content: ['./*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['Space Grotesk', ...defaultTheme.fontFamily.sans],
        mono:    ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        apex: {
          base:    '#070708',
          surface: '#0a0a0b',
          card:    '#0d0d0f',
          border:  '#1a1a1e',
          muted:   '#2a2a30',
          overlay: 'rgba(10,10,12,0.85)',
          cyan:    '#22d3ee',
          blue:    '#3b82f6',
          green:   '#34d399',
          amber:   '#fbbf24',
          red:     '#f87171',
          purple:  '#a78bfa',
          // Big V's Best Routes™ brand palette
          gold:    '#d4a017',
          goldDim: '#b8860b',
          silver:  '#c0c0c0',
          text: {
            primary:   '#f1f5f9',
            secondary: '#94a3b8',
            muted:     '#475569',
            dim:       '#334155',
          },
        },
      },
      boxShadow: {
        'glow-cyan':  '0 0 20px rgba(34,211,238,0.15)',
        'glow-green': '0 0 20px rgba(52,211,153,0.15)',
        'glow-red':   '0 0 20px rgba(248,113,113,0.15)',
        'glow-amber': '0 0 20px rgba(251,191,36,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
    },
  },
  plugins: [],
}
