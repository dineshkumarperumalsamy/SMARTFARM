import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          500: "#ff3b30",
          600: "#dc2626"
        },
        slate: {
          950: "#040508"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 18px 45px rgba(0,0,0,0.45)"
      },
      backgroundImage: {
        "tesla-grid":
          "radial-gradient(circle at top right, rgba(255, 59, 48, 0.14), transparent 48%), linear-gradient(130deg, rgba(255,255,255,0.04) 2px, transparent 2px)"
      },
      backgroundSize: {
        "tesla-grid": "100% 100%, 24px 24px"
      }
    }
  },
  plugins: []
};

export default config;
