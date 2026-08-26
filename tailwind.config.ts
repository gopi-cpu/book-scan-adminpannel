import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        "bg-alt": "#F5F9F9",
        ink: "#10293A",
        "ink-muted": "#61787F",
        primary: "#0B4F6C",
        "primary-dark": "#073B52",
        teal: "#0D9488",
        "teal-dark": "#0A7A70",
        mint: "#E3F5F0",
        "mint-line": "#C9E9E1",
        gold: "#C9922B",
        "gold-bg": "#FBF1DE",
        lavender: "#F1EEFB",
        peach: "#FDEFE8",
        sky: "#EAF3FB",
        rose: "#F6EEF3",
        border: "#E3EAEA"
      },
      fontFamily: {
        sora: ["Sora", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        inter: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
