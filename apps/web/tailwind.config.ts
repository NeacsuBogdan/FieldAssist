import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        grid: "linear-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.08) 1px, transparent 1px)",
      },
      boxShadow: {
        panel: "0 24px 64px rgba(15, 23, 42, 0.12)",
      },
      colors: {
        accent: {
          50: "#fff7ed",
          100: "#ffedd5",
          500: "#f97316",
          600: "#ea580c",
        },
        shell: "#e9efec",
        steel: {
          50: "#f8fafc",
          100: "#edf2f7",
          400: "#94a3b8",
          600: "#475569",
          900: "#0f172a",
        },
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
        sans: ["'Space Grotesk'", "system-ui", "sans-serif"],
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
};

export default config;
