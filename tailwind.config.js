module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        violetGradient: 'linear-gradient(90deg, #8B5CF6 0%, #6366F1 100%)',
      },
    },
  },
  plugins: [],
}
