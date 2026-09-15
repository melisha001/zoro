/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zoro: {
          blue: '#0F52BA',
          blueDark: '#0A3B86',
          navy: '#0B192C',
          green: '#10B981',
          greenDark: '#059669',
          lightBlue: '#EBF3FF',
          accent: '#FF6B00',
        }
      }
    },
  },
  plugins: [],
}
