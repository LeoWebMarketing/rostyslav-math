/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Squid Game theme colors
        dark: {
          DEFAULT: '#0f0f1a',
          light: '#1a1a2e',
        },
        gray: {
          DEFAULT: '#2a2a4a',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
        },
        pink: {
          DEFAULT: '#FF0080',
          glow: 'rgba(255, 0, 128, 0.5)',
        },
        teal: {
          DEFAULT: '#00F5D4',
          glow: 'rgba(0, 245, 212, 0.5)',
        },
        red: {
          DEFAULT: '#ff4757',
        },
        green: {
          DEFAULT: '#2ed573',
        },
        gold: {
          DEFAULT: '#ffd700',
        },
        caramel: {
          DEFAULT: '#d4a574',
          dark: '#b8956a',
        },
        sugar: {
          DEFAULT: '#f5e6d3',
        },
      },
      animation: {
        shake: 'shake 0.4s ease',
        pulse: 'pulse 2s infinite',
        bounce: 'bounce 0.6s ease',
        fadeIn: 'fadeIn 0.3s ease',
        slideUp: 'slideUp 0.3s ease',
        correctFlash: 'correctFlash 0.5s ease',
        floatUp: 'floatUp 1s ease forwards',
        firePulse: 'firePulse 0.5s infinite alternate',
        resultBounce: 'resultBounce 0.6s ease',
        starsAppear: 'starsAppear 0.8s ease 0.3s both',
        perfectPulse: 'perfectPulse 1s infinite',
        btnPulse: 'btnPulse 1s infinite',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-10px)' },
          '40%': { transform: 'translateX(10px)' },
          '60%': { transform: 'translateX(-10px)' },
          '80%': { transform: 'translateX(10px)' },
        },
        pulse: {
          '0%, 100%': {
            boxShadow: '0 0 40px rgba(255, 0, 128, 0.5)',
            transform: 'scale(1)'
          },
          '50%': {
            boxShadow: '0 0 60px rgba(255, 0, 128, 0.5)',
            transform: 'scale(1.05)'
          },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        correctFlash: {
          '0%': { boxShadow: '0 0 30px rgba(255, 0, 128, 0.5)' },
          '50%': {
            boxShadow: '0 0 60px rgba(46, 213, 115, 1), 0 0 100px rgba(46, 213, 115, 1)',
            borderColor: '#2ed573'
          },
          '100%': { boxShadow: '0 0 30px rgba(255, 0, 128, 0.5)' },
        },
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-100px) scale(1.5)' },
        },
        firePulse: {
          from: { transform: 'scale(1)' },
          to: { transform: 'scale(1.2)' },
        },
        resultBounce: {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.3)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        starsAppear: {
          '0%': { opacity: '0', transform: 'scale(0) rotate(-180deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        perfectPulse: {
          '0%, 100%': { textShadow: '0 0 20px #ffd700' },
          '50%': { textShadow: '0 0 40px #ffd700, 0 0 60px #ffd700' },
        },
        btnPulse: {
          '0%, 100%': { boxShadow: '0 5px 20px rgba(0, 245, 212, 0.5)' },
          '50%': { boxShadow: '0 5px 40px rgba(0, 245, 212, 0.5)' },
        },
      },
      boxShadow: {
        'pink-glow': '0 0 30px rgba(255, 0, 128, 0.5)',
        'teal-glow': '0 0 20px rgba(0, 245, 212, 0.5)',
        'green-glow': '0 0 30px rgba(46, 213, 115, 0.8)',
      },
    },
  },
  plugins: [],
};
