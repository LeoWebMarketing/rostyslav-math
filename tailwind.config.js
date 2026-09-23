/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './legacy/index.html',
    './legacy/src/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'jungle-900': '#12352A',
        'jungle-700': '#1F5A43',
        'leaf-500': '#2FB36B',
        'leaf-300': '#8EE0A8',
        'sand-100': '#FFF6DF',
        'sand-300': '#F3DFAE',
        'sun-400': '#FFC23D',
        'sunset-500': '#FF8A3D',
        'lava-500': '#E4572E',
        'sky-400': '#5CC8F5',
        'berry-500': '#B04ADB',
        'ink-900': '#1B2620',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      minHeight: {
        screen: '100vh',
      },
    },
  },
  plugins: [],
};
