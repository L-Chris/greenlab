import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        leaf: "#2f7d5c",
        mint: "#dff5eb",
        clay: "#b4694d",
        skyglass: "#e7f2f8"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
