/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cayenne: '#E55710',
        coffee: '#1F160A',
        twilight: '#251A66',
      },
      fontFamily: {
        sans: ['Rethink Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}