import { describe, it, expect } from "vitest";
import { isValidUid, getUidRegion, sanitizeUidInput } from "../../src/lib/uid";

describe("isValidUid", () => {
  it("accepts valid 9-digit UID starting with 1-9", () => {
    expect(isValidUid("700600838")).toBe(true);
    expect(isValidUid("600123456")).toBe(true);
    expect(isValidUid("812345678")).toBe(true);
  });

  it("rejects UIDs starting with 0", () => {
    expect(isValidUid("012345678")).toBe(false);
  });

  it("rejects non-9-digit input", () => {
    expect(isValidUid("12345678")).toBe(false);
    expect(isValidUid("1234567890")).toBe(false);
    expect(isValidUid("")).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(isValidUid("abc123456")).toBe(false);
    expect(isValidUid("70060083a")).toBe(false);
  });
});

describe("getUidRegion", () => {
  it("returns correct region for first digit", () => {
    expect(getUidRegion("700600838")).toBe("Europe");
    expect(getUidRegion("600123456")).toBe("Americas");
    expect(getUidRegion("800123456")).toBe("Asia");
    expect(getUidRegion("100123456")).toBe("CN");
  });

  it("returns Unknown for unrecognized prefix", () => {
    expect(getUidRegion("300123456")).toBe("Unknown");
  });
});

describe("sanitizeUidInput", () => {
  it("removes non-digit characters", () => {
    expect(sanitizeUidInput("700-600-838")).toBe("700600838");
    expect(sanitizeUidInput(" abc123def ")).toBe("123");
  });

  it("truncates to 9 characters", () => {
    expect(sanitizeUidInput("70060083800")).toBe("700600838");
  });
});
