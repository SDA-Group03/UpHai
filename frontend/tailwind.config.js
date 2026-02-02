/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "'Urbanist'", 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
