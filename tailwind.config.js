/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}', // 모든 확장자 포함
    './app/**/*.{js,ts,jsx,tsx,mdx}', // app 디렉토리도
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // pages 디렉토리도
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    theme: {
      extend: {
        colors: {
          primary: 'hsl(var(--primary))',
          'background-light': '#f5f7f8',
          'background-dark': '#101922',
          secondary: 'hsl(var(--secondary))',
          card: 'hsl(var(--card))',
          popover: 'hsl(var(--popover))',
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
        },
      },
      keyframes: {
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-8px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.3s ease-out',
      },
    },
  },
  plugins: [],
  safelist: ['bg-primary', 'text-primary', 'p-10'],
};
