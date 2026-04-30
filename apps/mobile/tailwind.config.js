/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdf8',
          100: '#d7faee',
          300: '#7aecc4',
          500: '#0fb37f',
          700: '#0a7d5a',
        },
      },
    },
  },
  plugins: [],
};