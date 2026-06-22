import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bright, airy light canvas with a faint lavender tint
        base: "#F4F2FC",
        surface: { DEFAULT: "#FFFFFF", raised: "#FFFFFF", overlay: "#F1ECFB" },
        line: "#E4DEF5",
        ink: { DEFAULT: "#1B1638", muted: "#5C5685", faint: "#938DB6" },
        // Vivid accents tuned for contrast on white
        brand: { DEFAULT: "#F59E0B", 600: "#D97706" },
        violet: { DEFAULT: "#7C3AED", 600: "#6D28D9" },
        indigo: { DEFAULT: "#4F46E5", 600: "#4338CA" },
        cyan: { DEFAULT: "#0891B2", 600: "#0E7490" },
        magenta: { DEFAULT: "#DB2777", 600: "#BE185D" },
        // Semantic (readable on light)
        bull: { DEFAULT: "#059669", soft: "rgba(5,150,105,0.12)" },
        bear: { DEFAULT: "#E11D48", soft: "rgba(225,29,72,0.12)" },
        warn: { DEFAULT: "#D97706", soft: "rgba(217,119,6,0.14)" },
        info: { DEFAULT: "#2563EB", soft: "rgba(37,99,235,0.12)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "brand-grad": "linear-gradient(100deg,#F59E0B 0%,#EC4899 50%,#7C3AED 100%)",
        "cool-grad": "linear-gradient(100deg,#06B6D4 0%,#6366F1 55%,#A855F7 100%)",
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.7) inset, 0 18px 50px -24px rgba(76,29,149,0.30)",
        "glow-brand": "0 0 0 1px rgba(245,158,11,0.30), 0 16px 44px -14px rgba(245,158,11,0.45)",
        "glow-violet": "0 0 0 1px rgba(124,58,237,0.28), 0 16px 44px -14px rgba(124,58,237,0.42)",
        "glow-cyan": "0 0 0 1px rgba(6,182,212,0.28), 0 16px 44px -14px rgba(6,182,212,0.42)",
        "glow-magenta": "0 0 0 1px rgba(219,39,119,0.28), 0 16px 44px -14px rgba(219,39,119,0.42)",
      },
      keyframes: {
        in: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        aurora: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)", opacity: "0.85" },
          "50%": { transform: "translate3d(2%,-2%,0) scale(1.08)", opacity: "1" },
        },
        shimmer: { "0%": { backgroundPosition: "0% 50%" }, "100%": { backgroundPosition: "200% 50%" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
      },
      animation: {
        in: "in .4s cubic-bezier(.2,.7,.2,1) both",
        aurora: "aurora 16s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        float: "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
