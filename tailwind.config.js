/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  safelist: [
    'border-red-500',
    'bg-red-50',
    'dark:bg-red-900/20',
    'border-blue-500',
    'bg-blue-50',
    'dark:bg-blue-900/20',
    'border-gray-500',
    'bg-gray-50',
    'dark:bg-gray-900/20',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
