/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#030303",
        fg: "#F4F4F4",
        accent: "#FF0033",
        // Keep these if wagmi/rainbowkit or existing complex components still complain, 
        // though we will migrate to bg/fg in the redesign.
        gray: {
          900: "#111",
          800: "#222",
          400: "#888",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "0",
        "3xl": "0",
        "xl": "0",
        "lg": "0",
        "md": "0",
        "sm": "0",
      },
    },
  },
  plugins: [],
};
