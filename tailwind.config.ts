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
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        moss: "rgb(var(--color-moss) / <alpha-value>)",
        sage: "rgb(var(--color-sage) / <alpha-value>)",
        clay: "rgb(var(--color-clay) / <alpha-value>)",
        linen: "rgb(var(--color-linen) / <alpha-value>)",
      },
      boxShadow: {
        tile: "0 10px 0 rgb(var(--color-tile-side)), 0 16px 28px rgb(var(--color-ink) / 0.18)",
        "tile-active": "0 7px 0 rgb(var(--color-clay)), 0 18px 34px rgb(var(--color-clay) / 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
