module.exports = {
  darkMode: 'class', // CRITICAL - enables dark mode
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
