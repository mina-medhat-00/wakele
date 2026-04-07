/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["LibreFranklin-Regular"],
      },
      colors: {
        "primary-black": "#121213",
      },
    },
  },
  plugins: [],
};
