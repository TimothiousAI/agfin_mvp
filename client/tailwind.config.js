/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Agrellus Brand Colors
        primary: {
          DEFAULT: '#30714C',
          50: '#E8F4ED',
          100: '#D1E9DB',
          200: '#A3D3B7',
          300: '#75BD93',
          400: '#47A76F',
          500: '#30714C', // Main brand green
          600: '#265A3D',
          700: '#1D442E',
          800: '#132D1F',
          900: '#0A170F',
        },
        accent: {
          DEFAULT: '#DDC66F',
          50: '#FAF8F0',
          100: '#F5F1E1',
          200: '#EBE3C3',
          300: '#E1D5A5',
          400: '#DDC66F', // Main accent gold
          500: '#D9B857',
          600: '#C29F3F',
          700: '#9A7E32',
          800: '#735E25',
          900: '#4C3F19',
        },
        // Dark Theme Backgrounds
        'bg-dark': '#061623',
        'bg-card': '#0D2233',
        'bg-hover': '#152D44',
        // Semantic Colors
        success: '#30714C',
        warning: '#DDC66F',
        error: '#DC2626',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Lato', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Lato', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
        'progress-indeterminate': 'progress-indeterminate 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'progress-indeterminate': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(250%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
}
