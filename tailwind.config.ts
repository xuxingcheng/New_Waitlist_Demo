import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      },
      colors: {
        ink: "#172033",
        panel: "#f7f8fb"
      }
    }
  },
  plugins: []
};

export default config;
