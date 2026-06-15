import type { EnkaResponse } from "../types/enka";

// Enka.Network allows CORS from browsers directly.
// In production (GitHub Pages), we call Enka directly.
// In development, the Vite dev server proxies /api/proxy to Enka.

const ENKA_DIRECT_URL = "https://enka.network/api/uid";

export interface ProxyResponse {
  success: boolean;
  data?: EnkaResponse;
  error?: string;
}

/**
 * Fetches Genshin character showcase data.
 * - In development: uses the Vite dev server proxy at /api/proxy
 * - In production: calls Enka.Network directly (CORS is allowed)
 */
export async function fetchShowcase(uid: string): Promise<EnkaResponse> {
  const isDev = import.meta.env.DEV;
  const url = isDev
    ? `/api/proxy?uid=${encodeURIComponent(uid)}`
    : `${ENKA_DIRECT_URL}/${encodeURIComponent(uid)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "ArtifactAurum/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Too many requests. Please wait a moment and try again.");
      }
      if (response.status === 424) {
        throw new Error("Enka.Network is currently undergoing maintenance. Please try again later.");
      }
      if (response.status === 400) {
        throw new Error("This UID could not be found. The player may not exist or their showcase is not public.");
      }
      if (response.status === 503) {
        throw new Error("Genshin Impact servers are currently unavailable. This may happen during version updates.");
      }
      throw new Error(`Server error (${response.status}). Please try again.`);
    }

    // In dev mode, response is wrapped in { success, data }
    // In production (direct Enka call), response IS the data
    if (isDev) {
      const json: ProxyResponse = await response.json();
      if (!json.success || !json.data) {
        throw new Error(
          json.error ?? "This UID could not be found. The player may not exist or their showcase is not public.",
        );
      }
      return json.data;
    } else {
      const data: EnkaResponse = await response.json();
      if (!data.avatarInfoList && !data.playerInfo) {
        throw new Error("This UID could not be found. The player may not exist or their showcase is not public.");
      }
      return data;
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
