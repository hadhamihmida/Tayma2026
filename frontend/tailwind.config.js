/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tui: {
          navy: '#0b1329',
          dark: '#0f172a',
          slate: '#1e293b',
          muted: '#334155',
          border: '#e2e8f0',
          blue: '#0284c7', // TUI primary accent
          cyan: '#0ea5e9',
          light: '#f8fafc',
          card: '#ffffff'
        }
      }
    },
  },
  plugins: [],
}
