import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--portal-primary, 244 157 37) / <alpha-value>)',
        'primary-dark': 'rgb(var(--portal-hover, 201 121 18) / <alpha-value>)',
        'primary-hover': 'rgb(var(--portal-hover, 227 139 20) / <alpha-value>)',
        'background-light': 'rgb(var(--portal-background, 248 247 245) / <alpha-value>)',
        'background-dark': 'rgb(var(--portal-night, 34 26 16) / <alpha-value>)',
        'surface-light': 'rgb(var(--portal-surface, 255 255 255) / <alpha-value>)',
        'surface-dark': 'rgb(var(--portal-night-surface, 45 36 24) / <alpha-value>)',
        'border-light': 'rgb(var(--portal-border, 232 221 206) / <alpha-value>)',
        'border-dark': 'rgb(var(--portal-night-border, 74 59 42) / <alpha-value>)',
        'text-main': 'rgb(var(--portal-ink, 28 22 13) / <alpha-value>)',
        'text-sub': 'rgb(var(--portal-muted, 156 122 73) / <alpha-value>)',
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
