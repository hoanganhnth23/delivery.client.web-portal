import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#f49d25',
        'primary-dark': '#c97912',
        'primary-hover': '#e38b14',
        'background-light': '#f8f7f5',
        'background-dark': '#221a10',
        'surface-light': '#ffffff',
        'surface-dark': '#2d2418',
        'border-light': '#e8ddce',
        'border-dark': '#4a3b2a',
        'text-main': '#1c160d',
        'text-sub': '#9c7a49',
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [forms],
};
