/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        studio: {
          ink: '#070A0F',
          panel: '#101620',
          raised: '#17202D',
          line: '#283244',
          teal: '#39D9C8',
          coral: '#FF7A6E',
          amber: '#F6C453',
          lilac: '#A99BFF',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(57, 217, 200, 0.16)',
      },
    },
  },
  plugins: [],
}
