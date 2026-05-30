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
      <div className="text-center space-y-4 max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight text-dark-text sm:text-5xl">
          Genshin <span className="text-accent">ArtScore</span>
        </h1>
        <p className="text-dark-muted text-lg">
          Enter a Genshin Impact UID to view artifact quality scores for every character on the
          showcase.
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
