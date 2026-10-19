/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Cairo', 'sans-serif'],
        arabic: ['Cairo', 'Amiri', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fff0f5',
          100: '#ffd6e7',
          200: '#ffadd2',
          300: '#ff85bb',
          400: '#ff5ca4',
          500: '#ff338d',
          600: '#e0006e',
          700: '#b30057',
          800: '#870040',
          900: '#5a002b',
        },
        romantic: {
          rose: '#ff6b9d',
          deep: '#c0392b',
          gold: '#f39c12',
          midnight: '#0d0d1a',
          twilight: '#1a1a2e',
          purple: '#6c3483',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'typewriter': 'typewriter 3s steps(40) 1s 1 normal both',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { textShadow: '0 0 5px #ff6b9d, 0 0 10px #ff6b9d' },
          '100%': { textShadow: '0 0 20px #ff6b9d, 0 0 40px #ff6b9d' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.15)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.15)' },
          '70%': { transform: 'scale(1)' },
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
};
