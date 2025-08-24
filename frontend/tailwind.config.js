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
        primary: {
          50: "#e6f0ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        accent: {
          500: "#a855f7", // violet-500
          600: "#7c3aed",
        },
        ink: {
          900: "#0a0f1e", // deep blue-black (background)
          800: "#0f172a", // slate-900-ish
          700: "#111827",
        },
        glass: {
          500: "rgba(18, 25, 43, 0.6)",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 8s ease-in-out infinite",
        glow: "glow 2.4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 0px rgba(168,85,247,0.0)" },
          "50%": { boxShadow: "0 0 24px rgba(168,85,247,0.45)" },
        },
      },
      boxShadow: {
        lifted:
          "0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};
