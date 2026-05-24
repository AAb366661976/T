/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        show: {
          "0%, 49.99%": { opacity: "0", zIndex: "1" },
          "50%, 100%": { opacity: "1", zIndex: "5" },
        },
      },
      animation: {
        show: "show 0.6s",
      },
    },
  },
  plugins: [],
};
