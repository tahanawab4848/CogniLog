/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Emerald OS — maps to CSS variables for synchronized theming
        em: {
          void:    "#050f08",
          base:    "#081209",
          surface: "#0d1f11",
          raised:  "#132918",
          accent:  "#10b981",
          teal:    "#2dd4bf",
          muted:   "#6b8f75",
          border:  "rgba(16, 185, 129, 0.15)",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: "0 0 30px rgba(16, 185, 129, 0.15)",
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
