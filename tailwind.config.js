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
        "primary-green": "#538d4e",
        "primary-yellow": "#b59f3b",
        "primary-grey": "#3a3a3c",
      },
    },
  },
  plugins: [],
};
