import { useCallback, useState } from "react";

interface PlayerHeaderProps {
  uid: string;
  playerInfo: {
    nickname: string;
    level: number;
    worldLevel: number;
    avatarIcon: string;
    signature: string;
  };
  characterCount: number;
  onRefresh: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PlayerHeader({ uid, playerInfo, characterCount, onRefresh }: PlayerHeaderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated] = useState(Date.now());

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1500);
  }, [onRefresh]);

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard API not available
    }
  }, []);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-dark-border bg-dark-card px-5 py-4">
      {/* Left: Player info */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-dark-border text-lg">
          👤
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="truncate text-base sm:text-lg font-semibold text-dark-text">{playerInfo.nickname}</h2>
            <span className="rounded-md bg-dark-border/50 px-2 py-0.5 text-xs font-mono text-dark-muted">
              {uid}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-dark-muted">
            <span>AR {playerInfo.level}</span>
            {playerInfo.worldLevel > 0 && (
              <>
                <span>·</span>
                <span>WL {playerInfo.worldLevel}</span>
              </>
            )}
            <span>·</span>
            <span>{characterCount} {characterCount === 1 ? "char" : "chars"}</span>
            <span>·</span>
            <span>Updated {formatTimeAgo(lastUpdated)}</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleCopyUrl}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-dark-muted hover:bg-dark-border/40 hover:text-dark-text transition-colors"
          title="Copy shareable URL"
        >
          📋 Share
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-dark-bg hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isRefreshing ? "animate-spin" : ""}
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
}
