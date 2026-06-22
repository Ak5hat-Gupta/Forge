import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep blue-black base with a violet tint
        base: "#07060F",
        surface: { DEFAULT: "#110F1F", raised: "#181530", overlay: "#221E40" },
        line: "#2C2750",
        ink: { DEFAULT: "#F3F1FF", muted: "#AEA9D4", faint: "#736E9E" },
        // Vivid neon accent system
        brand: { DEFAULT: "#F59E0B", 600: "#D97706" },
        violet: { DEFAULT: "#A855F7", 600: "#9333EA" },
        indigo: { DEFAULT: "#6366F1", 600: "#4F46E5" },
        cyan: { DEFAULT: "#22D3EE", 600: "#06B6D4" },
        magenta: { DEFAULT: "#EC4899", 600: "#DB2777" },
        // Semantic (brightened)
        bull: { DEFAULT: "#34E5B0", soft: "rgba(52,229,176,0.14)" },
        bear: { DEFAULT: "#FF5C8A", soft: "rgba(255,92,138,0.14)" },
        warn: { DEFAULT: "#FBBF24", soft: "rgba(251,191,36,0.14)" },
        info: { DEFAULT: "#38BDF8", soft: "rgba(56,189,248,0.14)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "brand-grad": "linear-gradient(100deg,#F59E0B 0%,#EC4899 50%,#A855F7 100%)",
        "cool-grad": "linear-gradient(100deg,#22D3EE 0%,#6366F1 55%,#A855F7 100%)",
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 60px -28px rgba(0,0,0,0.85)",
        "glow-brand": "0 0 0 1px rgba(245,158,11,0.35), 0 8px 40px -8px rgba(245,158,11,0.45)",
        "glow-violet": "0 0 0 1px rgba(168,85,247,0.35), 0 8px 40px -8px rgba(168,85,247,0.5)",
        "glow-cyan": "0 0 0 1px rgba(34,211,238,0.35), 0 8px 40px -8px rgba(34,211,238,0.5)",
        "glow-magenta": "0 0 0 1px rgba(236,72,153,0.35), 0 8px 40px -8px rgba(236,72,153,0.5)",
      },
      keyframes: {
        in: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        aurora: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)", opacity: "0.9" },
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
