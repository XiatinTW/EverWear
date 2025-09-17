/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/components/EriComponts/**/*.{js,jsx,ts,tsx}", "./src/pages/**/*.{js,jsx,ts,tsx}"], // 確保包含所有檔案
  theme: {
    // 覆蓋的樣式，例如：
    // colors: {
    //   primary: "#1e40af",
    //   secondary: "#64748b",
    // },
    extend: {
      colors: {
        primary: "#6B7A4F",
        secondary: "#EAE6D9",
        accent: "#3C1E14",
        base: {
          text: "#6E4F3A",
          background: "#fff",
          border: "#dee2e6",
        },
      },
      fontFamily: {
        heading: ['"Helvetica Neue"', "Arial", "sans-serif"],
      },
      fontSize: {
        h1: ["4rem", { lineHeight: "1.2", fontWeight: "700" }], // 64px
        h2: ["3rem", { lineHeight: "1.3", fontWeight: "600" }], // 48px
        h3: ["2.25rem", { lineHeight: "1.4", fontWeight: "600" }], // 36px
        h4: ["1.75rem", { lineHeight: "1.4", fontWeight: "500" }], // 28px
        h5: ["1.5rem", { lineHeight: "1.5", fontWeight: "500" }], // 24px
        h6: ["1.25rem", { lineHeight: "1.5", fontWeight: "400" }], // 20px
        p: ["1rem", { lineHeight: "1.5", fontWeight: "400" }], // 16px
      },
      backgroundImage: {
        "linear-gradient":
          "linear-gradient(to bottom, rgba(255, 255, 255, 0.15), #ffffff)", // 自定義線性漸變
      },
      keyframes: {
        waveUp: {
          "0%,100%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(-6px)" },
          "50%": { transform: "translateY(4px)" },
          "75%": { transform: "translateY(-3px)" },
        },
        waveDown: {
          "0%,100%": { transform: "translateY(0)" },
          "25%": { transform: "translateY(6px)" },
          "50%": { transform: "translateY(-4px)" },
          "75%": { transform: "translateY(3px)" },
        },
      },
      animation: {
        waveUp: "waveUp var(--speed,0.6s) ease-in-out infinite",
        waveDown: "waveDown var(--speed,0.6s) ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
