import type { EnkaResponse } from "../types/enka";

// NOTE: Enka API is at enka.network/api/uid/{uid} (not api.enka.network)

export interface ProxyResponse {
  success: boolean;
  data?: EnkaResponse;
  error?: string;
}

/**
 * Fetches Genshin character showcase data from the Vercel Edge Function proxy
 * (which in turn calls Enka.Network to avoid CORS issues).
 */
export async function fetchShowcase(uid: string): Promise<EnkaResponse> {
  const url = `/api/proxy?uid=${encodeURIComponent(uid)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Too many requests. Please wait a moment and try again.");
      }
      if (response.status === 424) {
        throw new Error("Enka.Network is currently undergoing maintenance. Please try again later.");
      }
      if (response.status === 503) {
        throw new Error("Genshin Impact servers are currently unavailable. This may happen during version updates.");
      }
      throw new Error(`Server error (${response.status}). Please try again.`);
    }

    const json: ProxyResponse = await response.json();

    if (!json.success || !json.data) {
      throw new Error(
        json.error ?? "This UID could not be found. The player may not exist or their showcase is not public.",
      );
    }

    return json.data;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
