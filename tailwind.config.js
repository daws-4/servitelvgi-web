import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        primary: '#3e78b2',    // Rich Cerulean
        secondary: '#004ba8',  // Cobalt Blue
        background: '#deefb7', // Tea Green
        accent: '#deefb7',     // Tea Green (semantic alias)
        neutral: '#bcabae',    // Lilac Ash
        dark: '#0f0f0f',       // Onyx
        success: '#17c964',    // Verde éxito
        warning: '#f5a524',    // Naranja alerta
      }
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}

module.exports = config;