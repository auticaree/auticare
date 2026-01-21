import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors - Calm Tech palette from DESIGN.md
        primary: {
          DEFAULT: "#17cfb0",
          dark: "#12a38a",
          light: "#4de8cf",
        },
        // Sage Green - Calm, growth
        sage: {
          50: "#f0f7f4",
          100: "#e7f3eb",
          200: "#c5e2d0",
          300: "#9fccb2",
          400: "#6fae8c",
          500: "#4e9767",
          600: "#3d7a53",
          700: "#366948",
          800: "#2d5339",
          900: "#27452f",
        },
        // Soft Teal - Trust, health
        teal: {
          50: "#f0f9f7",
          100: "#dcf0ed",
          200: "#bce2dc",
          300: "#8fccc4",
          400: "#5ab0a7",
          500: "#3f958c",
          600: "#317872",
          700: "#2a615d",
          800: "#264f4c",
          900: "#234240",
        },
        // Muted Coral - Soft accent
        coral: {
          DEFAULT: "#d66a6a",
          light: "#e8a0a0",
          dark: "#b85555",
        },
        // Lavender - Secondary accent
        lavender: {
          DEFAULT: "#9d8bb7",
          light: "#c5b8d9",
          dark: "#7a6a94",
        },
        // Background colors
        background: {
          light: "#f6f8f8",
          dark: "#11211e",
        },
        // Surface colors
        surface: {
          light: "#ffffff",
          dark: "#1a2e2b",
        },
        // Stone - Warm grays
        stone: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
        // Text colors
        "text-subtle": "#93c8bf",
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(0, 0, 0, 0.1)",
        glow: "0 0 15px rgba(23, 207, 176, 0.15)",
        tactile: "0 4px 0 0 rgba(0,0,0,0.2)",
        "tactile-active": "0 1px 0 0 rgba(0,0,0,0.2) inset",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
