import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)"],
        display: ["var(--font-display)"]
      },
      boxShadow: {
        float: "0 20px 60px -24px rgb(8 31 48 / 0.35)",
        soft: "0 8px 30px -16px rgb(8 31 48 / 0.28)"
      },
      animation: {
        rise: "rise 500ms cubic-bezier(.16,1,.3,1) both",
        pulseRing: "pulseRing 2s cubic-bezier(.4,0,.6,1) infinite"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseRing: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(220 38 38 / 0.3)" },
          "50%": { boxShadow: "0 0 0 12px rgb(220 38 38 / 0)" }
        }
      }
    }
  },
  plugins: []
}

export default config
