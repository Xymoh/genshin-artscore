export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0f1117",
          card: "#1a1d2e",
          border: "#2a2d3e",
          text: "#e4e4e7",
          muted: "#8b8fa3",
        },
        grade: {
          "s-plus": "#ffd700",
          s: "#ff8c00",
          a: "#a855f7",
          b: "#3b82f6",
          c: "#22c55e",
          d: "#6b7280",
          f: "#ef4444",
        },
        element: {
          pyro: "#ef4444",
          hydro: "#3b82f6",
          anemo: "#22d3ee",
          electro: "#a855f7",
          dendro: "#22c55e",
          cryo: "#93c5fd",
          geo: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
