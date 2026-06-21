import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0B0D",
        surface: "#16191F",
        line: "#23272F",
        ink: "#F2F4F7",
        muted: "#9BA3AF",
        brand: "#F59E0B",
      },
    },
  },
} satisfies Config;
