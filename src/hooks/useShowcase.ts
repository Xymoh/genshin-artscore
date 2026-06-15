import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchShowcase } from "../lib/api";
import { parseShowcaseData } from "../lib/parsing";
import { scoreArtifact, scoreBuild } from "../lib/scoring";
import type { ShowcaseData } from "../types/character";

export function useShowcase(uid: string) {
  const queryClient = useQueryClient();

  const queryFn = useCallback(async () => {
    const raw = await fetchShowcase(uid);

    // Parse raw Enka data into domain models
    const parsed = parseShowcaseData(raw);

    // Score all artifacts and builds
    for (const character of parsed.characters) {
      character.artifacts = character.artifacts.map((art) =>
        scoreArtifact(art, character.avatarId),
      );
      character.buildScore = scoreBuild(character);
    }

    // Re-sort after scoring (in case scores changed)
    parsed.characters.sort((a, b) => b.buildScore.total - a.buildScore.total);

    return parsed;
  }, [uid]);

  const query = useQuery<ShowcaseData, Error>({
    queryKey: ["showcase", uid],
    queryFn,
    enabled: uid.length === 9 && /^[1-9]\d{8}$/.test(uid),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Force refresh: invalidate cache and refetch
  const forceRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["showcase", uid] });
  }, [queryClient, uid]);

  return { ...query, forceRefresh };
}
