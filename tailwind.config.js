/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
    theme: {
    extend: {
      colors: {
        primary: "#0E4D92",
        accent: "#F59E0B",
        card: "#1A1A2E",
      },
      fontFamily: {
        sans: ["Rubik_400Regular"],
        medium: ["Rubik_500Medium"],
        bold: ["Rubik_700Bold"],
      },
    },
  },

  plugins: [],
};
