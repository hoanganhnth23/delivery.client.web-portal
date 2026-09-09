import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--portal-primary, 238 77 45) / <alpha-value>)',
        'primary-dark': 'rgb(var(--portal-hover, 215 50 17) / <alpha-value>)',
        'primary-hover': 'rgb(var(--portal-hover, 215 50 17) / <alpha-value>)',
        'background-light': 'rgb(var(--portal-background, 245 245 245) / <alpha-value>)',
        'background-dark': 'rgb(var(--portal-night, 23 23 23) / <alpha-value>)',
        'surface-light': 'rgb(var(--portal-surface, 255 255 255) / <alpha-value>)',
        'surface-dark': 'rgb(var(--portal-night-surface, 35 35 35) / <alpha-value>)',
        'border-light': 'rgb(var(--portal-border, 235 235 235) / <alpha-value>)',
        'border-dark': 'rgb(var(--portal-night-border, 60 60 60) / <alpha-value>)',
        'text-main': 'rgb(var(--portal-ink, 38 38 38) / <alpha-value>)',
        'text-sub': 'rgb(var(--portal-muted, 117 117 117) / <alpha-value>)',
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
