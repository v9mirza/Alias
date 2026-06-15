/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#111111",
        card: "#171717",
        border: "#262626",
        primaryText: "#FFFFFF",
        secondaryText: "#A1A1AA",
        accent: "var(--accent)", 
        accentHover: "var(--accent-hover)",
        accentIndigo: "#6366F1", 
      },
      fontFamily: {
        sans: ["Inter", "Geist", "sans-serif"],
        mono: ["GeistMono", "SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", "monospace"],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
