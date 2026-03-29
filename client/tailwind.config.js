/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3C3489',
        secondary: '#1D9E75',
        danger: '#D85A30',
        success: '#27500A',
      },
    },
  },
  plugins: [],
}
