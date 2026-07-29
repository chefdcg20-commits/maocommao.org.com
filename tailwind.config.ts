import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#173476',
          900: '#10234f'
        },
        gold: '#fbbf24'
      },
      boxShadow: {
        soft: '0 20px 60px rgba(15, 35, 79, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
