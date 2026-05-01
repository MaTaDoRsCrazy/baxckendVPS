import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        sand: "#f8f4ea",
        clay: "#d8a25e",
        moss: "#1f6f5f",
        ember: "#b9412e",
        slate: "#52606d"
      },
      boxShadow: {
        panel: "0 16px 40px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
