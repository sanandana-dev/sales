/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pulse: {
          bg: '#F5F6F8',
          sidebar: '#151927',
          card: '#FFFFFF',
          text: '#172033',
          muted: '#64748B',
          orange: '#FF901E',
          blue: '#2563EB',
          purple: '#7C3AED',
          green: '#159B67',
          navy: '#0F172A',
          darkCard: '#1E2436'
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      }
    }
  },
  plugins: []
};
