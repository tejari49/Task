/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        pp: {
          50:  "#eef6ff",
          100: "#daeaff",
          200: "#bedaff",
          300: "#91c3ff",
          400: "#5da2fc",
          500: "#387ff8",
          600: "#2260ed",
          700: "#1a4cda",
          800: "#1c3fb0",
          900: "#1c398b",
          950: "#162555",
        },
        lime: { 400: "#a3e635", 500: "#84cc16" },
        coral: { 400: "#fb7185", 500: "#f43f5e" },
        amber: { 400: "#fbbf24", 500: "#f59e0b" },
        violet: { 400: "#a78bfa", 500: "#8b5cf6" },
        mint: { 400: "#34d399", 500: "#10b981" },
        dark: {
          50:  "#f5f5f6",
          100: "#e6e6e8",
          200: "#d0d0d4",
          300: "#afafb6",
          400: "#868690",
          500: "#6b6b76",
          600: "#5b5b64",
          700: "#4e4e55",
          800: "#2a2a32",
          850: "#1e1e28",
          900: "#16161e",
          950: "#0a0a1a",
        },
      },
      fontFamily: {
        display: ['"Nunito"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
        mono: ['"Fira Code"', "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "nudge": "nudge 0.5s ease-in-out",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)",
        "slide-down": "slideDown 0.35s cubic-bezier(0.16,1,0.3,1)",
        "fade-in": "fadeIn 0.2s ease-out",
        "pop": "pop 0.3s cubic-bezier(0.68,-0.55,0.265,1.55)",
        "pulse-soft": "pulseSoft 2.5s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        nudge: {
          "0%,100%": { transform: "translateX(0)" },
          "10%": { transform: "translateX(-8px)" },
          "20%": { transform: "translateX(8px)" },
          "30%": { transform: "translateX(-5px)" },
          "40%": { transform: "translateX(5px)" },
          "50%": { transform: "translateX(-2px)" },
          "60%": { transform: "translateX(2px)" },
        },
        slideUp: {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        pop: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseSoft: {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(0.85)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};
