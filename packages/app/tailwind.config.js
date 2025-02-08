/** @type {import('tailwindcss').Config} */
export default {
  corePlugins: {
    preflight: true, // Ensure this is set to true
  },
  content: [
    "./lib/**/*.{html,js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [
  ],
}

