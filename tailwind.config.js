/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        trade: {
          bg: '#0b0e14',
          card: '#121721',
          border: '#1f293d',
          accent: '#2962ff',
          green: '#00c076',
          greenHover: '#00a364',
          red: '#ff4d4f',
          redHover: '#e03b3d',
          gold: '#f0b90b',
          muted: '#848e9c',
        }
      }
    },
  },
  plugins: [],
}
