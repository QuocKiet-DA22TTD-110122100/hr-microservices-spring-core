/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Segoe UI', 'Arial', 'sans-serif'],
        display: ['"Segoe UI Variable Display"', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['"Segoe UI Variable Display"', 'Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
