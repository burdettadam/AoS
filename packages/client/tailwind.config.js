/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'botc-red': '#8B0000',
        'botc-blue': '#000080',
        'botc-gold': '#FFD700',
        'clocktower': {
          'dark': '#1a1a1a',
          'darker': '#0f0f0f',
          'light': '#2a2a2a',
          'accent': '#d4af37'
        }
      },
      fontFamily: {
        'medieval': ['Cinzel', 'serif'],
        'body': ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
