/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep void background
        void: {
          50: '#1a1a2e',
          100: '#16162a',
          200: '#121226',
          300: '#0e0e22',
          400: '#0a0a1e',
          500: '#08081a',
          600: '#060616',
          700: '#040412',
          800: '#02020e',
          900: '#01010a',
          950: '#000005',
        },
        // Electric cyan for X player
        neon: {
          cyan: '#00f0ff',
          'cyan-dim': '#00b8c4',
          'cyan-glow': '#00f0ff80',
        },
        // Hot magenta for O player
        plasma: {
          pink: '#ff00aa',
          'pink-dim': '#cc0088',
          'pink-glow': '#ff00aa80',
        },
        // Electric purple accents
        electric: {
          purple: '#a855f7',
          'purple-dim': '#7c3aed',
          'purple-glow': '#a855f780',
        },
        // Victory gold
        victory: {
          gold: '#ffd700',
          'gold-dim': '#b8860b',
          'gold-glow': '#ffd70080',
        },
      },
      fontFamily: {
        display: ['"Orbitron"', 'sans-serif'],
        body: ['"Rajdhani"', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px #00f0ff, 0 0 40px #00f0ff40, 0 0 60px #00f0ff20',
        'neon-cyan-sm': '0 0 10px #00f0ff, 0 0 20px #00f0ff40',
        'neon-pink': '0 0 20px #ff00aa, 0 0 40px #ff00aa40, 0 0 60px #ff00aa20',
        'neon-pink-sm': '0 0 10px #ff00aa, 0 0 20px #ff00aa40',
        'neon-purple': '0 0 20px #a855f7, 0 0 40px #a855f740',
        'neon-gold': '0 0 30px #ffd700, 0 0 60px #ffd70060, 0 0 90px #ffd70030',
        'glow-intense': '0 0 40px currentColor, 0 0 80px currentColor',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'scan': 'scan 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'victory-pulse': 'victory-pulse 0.5s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'grid-flow': 'grid-flow 20s linear infinite',
        'text-shimmer': 'text-shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.2)' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'victory-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'grid-flow': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '50px 50px' },
        },
        'text-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)
        `,
        'radial-glow': 'radial-gradient(ellipse at center, rgba(0, 240, 255, 0.1) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
