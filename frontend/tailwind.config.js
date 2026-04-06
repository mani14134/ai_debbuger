/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Syne"', 'sans-serif'],
      },
      colors: {
        base: '#0a0b0f',
        surface: '#111218',
        border: '#1e2030',
        accent: '#00ff88',
        warn: '#ff6b35',
        crit: '#ff2d55',
        info: '#00b4ff',
        muted: '#4a5060',
        text: '#e2e8f0',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0,255,136,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(0,255,136,0.8), 0 0 40px rgba(0,255,136,0.3)' },
        }
      },
      backgroundImage: {
        'grid': "linear-gradient(rgba(30,32,48,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30,32,48,0.5) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
