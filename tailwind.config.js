/** @type {import('tailwindcss').Config} */
module.exports = {
  // Touch screens must never keep a hover style after a tap.
  future: {
    hoverOnlyWhenSupported: true,
  },
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
        cream: "var(--cream)",
        "fest-red": "var(--fest-red)",
        "fest-red-dark": "var(--fest-red-dark)",
        "fest-red-mid": "var(--fest-red-mid)",
        "fest-red-bright": "var(--fest-red-bright)",
        "fest-red-soft": "var(--fest-red-soft)",
        "red-dark": "var(--fest-red-dark)",
        "red-glow": "var(--fest-red-bright)",
        navy: "#06123A",
        royal: "#1E3FA8",
        lavender: "#8C7BFF",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        // 13px is the smallest type allowed on the public site.
        xs: ["0.8125rem", { lineHeight: "1.4" }],
      },
    },
  },
  plugins: [],
};
