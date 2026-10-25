/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: "#EDE4D3",
        "fest-red": "#E5121F",
        "red-dark": "#8A0010",
        "red-glow": "#FF1F2D",
        navy: "#06123A",
        royal: "#1E3FA8",
        lavender: "#8C7BFF",
      },
      fontFamily: {
        orbitron: ["var(--font-orbitron)"],
        space: ["var(--font-space)"],
        inter: ["var(--font-inter)"],
      },
    },
  },
  plugins: [],
};
