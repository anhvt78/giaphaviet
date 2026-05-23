/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Nếu bạn để file ở ngoài root, hãy thêm các dòng tương ứng
    "./*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Times New Roman"', "serif"],
      },
      colors: {
        parchment: {
          light: "#fdf8e9",
          DEFAULT: "#e8d5b5",
          dark: "#3d2611",
        },
      },
    },
  },
  plugins: [],
};
