import { BrandTheme } from './src/config.ts';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Firstscience AI Brand Colors
      colors: {
        'brand-orange': BrandTheme.orange,
        'brand-purple': BrandTheme.purple,
        'brand-black': BrandTheme.black,
        'brand-white': BrandTheme.white,
        'primary-pink': BrandTheme.pink,
        'primary-blue': BrandTheme.blue,
        'primary-teal': BrandTheme.teal,
        'primary-violet': BrandTheme.violet,
        'primary-green': BrandTheme.green,
      },

      // Custom Animations
      animation: {
        'gradient': 'gradient 3s linear infinite',
        'blob': 'blob 7s ease-in-out infinite',
        'breath': 'breath 8s ease-in-out infinite',
      },

      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        blob: {
          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)',
            opacity: '0.3',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
            opacity: '0.5',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
            opacity: '0.4',
          },
        },
        breath: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
      },

      // Font Family
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },

      // Backdrop Blur for Glassmorphism
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
