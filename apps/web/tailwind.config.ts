import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#05070d",
        panel: "rgba(9, 17, 30, 0.72)",
        cyanline: "rgba(54, 211, 236, 0.28)",
        signal: "#32d6c5",
        aurora: "#66e7ff",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        "panel-glow": "0 0 0 1px rgba(70, 211, 255, 0.12), 0 24px 90px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
} satisfies Config;
