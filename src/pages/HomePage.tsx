import { UidInput } from "../components/ui/UidInput";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Link } from "react-router-dom";

interface RecentUid {
  uid: string;
  timestamp: number;
}

export function HomePage() {
  const [recentUids] = useLocalStorage<RecentUid[]>("recent-uids", []);

  return (
    <div className="flex flex-col items-center justify-center gap-12 py-12">
      {/* Hero section */}
      <div className="text-center space-y-5 max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">Artifact Aurum</span>
        </h1>
        <p className="text-dark-muted text-base font-medium tracking-wide uppercase">
          Score your artifacts like the pros
        </p>
        <p className="text-dark-muted/80 text-lg">
          Enter a UID to instantly evaluate artifact quality across your entire showcase — per
          character, per piece.
        </p>
      </div>

      {/* UID Input */}
      <div className="w-full max-w-md">
        <UidInput />
      </div>

      {/* Recent lookups */}
      {recentUids.length > 0 && (
        <div className="w-full max-w-md space-y-3">
          <h2 className="text-dark-muted text-sm font-medium uppercase tracking-wider">
            Recent Lookups
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentUids.slice(0, 6).map((entry) => (
              <Link
                key={entry.uid}
                to={`/showcase/${entry.uid}`}
                className="rounded-lg bg-dark-card border border-dark-border px-4 py-2 text-dark-text text-sm no-underline hover:border-accent hover:text-accent transition-colors"
              >
                {entry.uid}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
