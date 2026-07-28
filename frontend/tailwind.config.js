/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ---------------------------------------------------------------
      // COLOR SYSTEM
      // "brand" is kept for backwards compatibility with existing pages;
      // "primary" is the canonical enterprise indigo scale going forward.
      // ---------------------------------------------------------------
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
        },
        primary: {
          25: '#f7f8ff',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        neutral: {
          0: '#ffffff',
          25: '#fcfcfd',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },

      // ---------------------------------------------------------------
      // TYPOGRAPHY
      // ---------------------------------------------------------------
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.375rem' }],
        md: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.75rem' }],
      },

      // ---------------------------------------------------------------
      // 8-POINT SPACING SYSTEM (adds finer + larger steps on top of the
      // Tailwind default 4px scale, all multiples of 4/8 for consistency)
      // ---------------------------------------------------------------
      spacing: {
        4.5: '1.125rem',
        9.5: '2.375rem',
        13: '3.25rem',
        15: '3.75rem',
        18: '4.5rem',
        19: '4.75rem',
        22: '5.5rem',
        30: '7.5rem',
        66: '16.5rem',
      },

      // ---------------------------------------------------------------
      // RADIUS
      // ---------------------------------------------------------------
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },

      // ---------------------------------------------------------------
      // SHADOWS — soft, low-opacity, enterprise SaaS style
      // ---------------------------------------------------------------
      boxShadow: {
        xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        sm: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        DEFAULT: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
        md: '0 4px 8px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.04)',
        lg: '0 12px 16px -4px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03)',
        xl: '0 20px 24px -4px rgba(15, 23, 42, 0.10), 0 8px 8px -4px rgba(15, 23, 42, 0.03)',
        focus: '0 0 0 4px rgba(99, 102, 241, 0.15)',
      },

      // ---------------------------------------------------------------
      // ANIMATION
      // ---------------------------------------------------------------
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'fade-out': { from: { opacity: 1 }, to: { opacity: 0 } },
        'scale-in': { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
        'slide-in-right': { from: { opacity: 0, transform: 'translateX(12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        'slide-in-top': { from: { opacity: 0, transform: 'translateY(-6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { from: { backgroundPosition: '-480px 0' }, to: { backgroundPosition: '480px 0' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'fade-out': 'fade-out 150ms ease-in',
        'scale-in': 'scale-in 150ms ease-out',
        'slide-in-right': 'slide-in-right 200ms ease-out',
        'slide-in-top': 'slide-in-top 150ms ease-out',
        'slide-up': 'slide-up 200ms ease-out',
        shimmer: 'shimmer 1.6s linear infinite',
      },
      transitionDuration: {
        150: '150ms',
        250: '250ms',
      },
    },
  },
  plugins: [],
};
