import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="border-b border-dark-border bg-dark-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 font-bold text-lg tracking-tight text-dark-text no-underline">
          <span className="text-accent text-2xl">✦</span>
          <span>Genshin ArtScore</span>
        </Link>
        <nav className="flex items-center gap-4">
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-sm text-dark-muted hover:text-dark-text transition-colors"
            onClick={() => {
              const root = document.documentElement;
              const current = root.getAttribute("data-theme");
              root.setAttribute("data-theme", current === "light" ? "dark" : "light");
            }}
            aria-label="Toggle theme"
          >
            🌓
          </button>
        </nav>
      </div>
    </header>
  );
}
