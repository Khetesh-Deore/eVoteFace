/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary:   "#1a237e", // deep navy
        accent:    "#ff6f00", // saffron
        success:   "#2e7d32", // green
        danger:    "#c62828", // red
        muted:     "#f5f5f5", // light grey bg
        dark:      "#212121", // near black text
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
