import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: "#0B0C0E",
        noir: "#050506",
        parchment: "#E7E1D5",
        "parchment-dim": "#C8C2B6",
        crimson: "#7F2525",
        "crimson-bright": "#A82B2B",
        gold: "#A88952",
        "gold-bright": "#C8A668",
        steel: "#555A60",
        "steel-dark": "#23262A",
        "steel-light": "#7B828C",
      },
      fontFamily: {
        cinematic: ["'Cinzel'", "'Georgia'", "serif"],
        typewriter: ["'Courier Prime'", "'Courier New'", "monospace"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        dossier: "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 15px rgba(168, 137, 82, 0.15)",
        noir: "0 10px 30px -5px rgba(0, 0, 0, 0.9)",
        crimson: "0 0 20px rgba(127, 37, 37, 0.4)",
        gold: "0 0 25px rgba(168, 137, 82, 0.35)",
      },
      backgroundImage: {
        "vignette": "radial-gradient(circle at center, transparent 30%, rgba(5, 5, 6, 0.85) 100%)",
        "film-grain": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
};
export default config;
