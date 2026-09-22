import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: '#07080A',
          900: '#0C0D10',
          850: '#101216',
          800: '#15171C',
          750: '#1A1D23',
          700: '#22262E',
          600: '#2E333E',
          500: '#4B5563',
          400: '#9CA3AF',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
        },
        workbench: {
          bg: '#0C0D10',
          panel: '#15171C',
          panelHover: '#1A1D23',
          border: '#27272A',
          borderSubtle: '#1E2025',
          borderActive: '#3F3F46',
          textMuted: '#71717A',
          textSecondary: '#A1A1AA',
          textPrimary: '#FAFAFA',
          emerald: '#10B981',
          emeraldHover: '#059669',
          amber: '#F59E0B',
          amberHover: '#D97706',
          crimson: '#EF4444',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Geist Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '0.9rem' }],
        'xs-mono': ['0.72rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'hairline': '0 0 0 1px rgba(255, 255, 255, 0.07)',
        'craftsman': '0 4px 20px -2px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
