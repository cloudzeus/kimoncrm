/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand colors
        brand: {
          DEFAULT: "hsl(var(--color-brand))",
          foreground: "hsl(var(--color-brand-foreground))",
          50: "hsl(var(--color-brand-50))",
          100: "hsl(var(--color-brand-100))",
          200: "hsl(var(--color-brand-200))",
          300: "hsl(var(--color-brand-300))",
          400: "hsl(var(--color-brand-400))",
          500: "hsl(var(--color-brand-500))",
          600: "hsl(var(--color-brand-600))",
          700: "hsl(var(--color-brand-700))",
          800: "hsl(var(--color-brand-800))",
          900: "hsl(var(--color-brand-900))",
          950: "hsl(var(--color-brand-950))",
        },
        // Success colors
        success: {
          DEFAULT: "hsl(var(--color-success))",
          foreground: "hsl(var(--color-success-foreground))",
          50: "hsl(var(--color-success-50))",
          100: "hsl(var(--color-success-100))",
          200: "hsl(var(--color-success-200))",
          300: "hsl(var(--color-success-300))",
          400: "hsl(var(--color-success-400))",
          500: "hsl(var(--color-success-500))",
          600: "hsl(var(--color-success-600))",
          700: "hsl(var(--color-success-700))",
          800: "hsl(var(--color-success-800))",
          900: "hsl(var(--color-success-900))",
          950: "hsl(var(--color-success-950))",
        },
        // Warning colors
        warning: {
          DEFAULT: "hsl(var(--color-warning))",
          foreground: "hsl(var(--color-warning-foreground))",
          50: "hsl(var(--color-warning-50))",
          100: "hsl(var(--color-warning-100))",
          200: "hsl(var(--color-warning-200))",
          300: "hsl(var(--color-warning-300))",
          400: "hsl(var(--color-warning-400))",
          500: "hsl(var(--color-warning-500))",
          600: "hsl(var(--color-warning-600))",
          700: "hsl(var(--color-warning-700))",
          800: "hsl(var(--color-warning-800))",
          900: "hsl(var(--color-warning-900))",
          950: "hsl(var(--color-warning-950))",
        },
        // Danger colors
        danger: {
          DEFAULT: "hsl(var(--color-danger))",
          foreground: "hsl(var(--color-danger-foreground))",
          50: "hsl(var(--color-danger-50))",
          100: "hsl(var(--color-danger-100))",
          200: "hsl(var(--color-danger-200))",
          300: "hsl(var(--color-danger-300))",
          400: "hsl(var(--color-danger-400))",
          500: "hsl(var(--color-danger-500))",
          600: "hsl(var(--color-danger-600))",
          700: "hsl(var(--color-danger-700))",
          800: "hsl(var(--color-danger-800))",
          900: "hsl(var(--color-danger-900))",
          950: "hsl(var(--color-danger-950))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
