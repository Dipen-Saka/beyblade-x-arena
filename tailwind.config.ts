import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ["Orbitron", "monospace"],
        rajdhani: ["Rajdhani", "sans-serif"],
      },
      colors: {
        arena: {
          bg: "#08080f",
          s1: "#0f0f1a",
          s2: "#161625",
          s3: "#1e1e30",
          s4: "#252538",
          border: "#2a2a42",
          border2: "#353555",
        },
        gold: { DEFAULT: "#f0b429", light: "#f5c842", dark: "#c8921a" },
      },
      animation: {
        "spin-slow": "spin 6s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
