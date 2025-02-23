/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chat-dark': '#0a0f2d',
        'chat-darker': '#060b24',
        'chat-light': '#1a1f3d',
        'accent': '#00f5d4',
        'accent-hover': '#00d4b8',
        'secondary': '#4264fb',
      },
    },
  },
  plugins: [],
}