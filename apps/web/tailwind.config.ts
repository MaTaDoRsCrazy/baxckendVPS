import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f8f3",
        panel: "#ffffff",
        ink: "#17212b",
        muted: "#5d6b79",
        ocean: "#1d6f8f",
        mint: "#4b8f7a",
        coral: "#df6f4a",
        stroke: "#d9e1e7"
      },
      boxShadow: {
        soft: "0 18px 42px rgba(23, 33, 43, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
