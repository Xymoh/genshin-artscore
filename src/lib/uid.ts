/**
 * Validate a Genshin Impact UID.
 * - Must be exactly 9 digits
 * - First digit must be 1-9 (region-coded)
 */
export function isValidUid(uid: string): boolean {
  return /^[1-9]\d{8}$/.test(uid);
}

/**
 * Parse the region from a Genshin UID's first digit.
 * 1 = Celestia (CN), 5 = Asia (TW/HK/MO old), 6 = America, 7 = Europe, 8 = Asia, 9 = TW/HK/MO
 */
export function getUidRegion(uid: string): string {
  const first = uid.charAt(0);
  const regions: Record<string, string> = {
    "1": "CN",
    "2": "CN",
    "5": "TW/HK/MO",
    "6": "Americas",
    "7": "Europe",
    "8": "Asia",
    "9": "TW/HK/MO",
  };
  return regions[first] ?? "Unknown";
}

/**
 * Sanitize a raw input string to only digits, max length 9.
 */
export function sanitizeUidInput(input: string): string {
  return input.replace(/\D/g, "").slice(0, 9);
}
