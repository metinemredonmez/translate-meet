import { describe, expect, it } from "vitest";
import { formatDetail, parseUtc } from "@/lib/format";

describe("format helpers", () => {
  it("reads offset-less backend timestamps as UTC", () => {
    expect(parseUtc("2026-11-22T21:01:00.123").toISOString()).toBe("2026-11-22T21:01:00.123Z");
    expect(parseUtc("2026-11-22T21:01:00+03:00").toISOString()).toBe("2026-11-22T18:01:00.000Z");
    expect(parseUtc("2026-11-22T21:01:00Z").toISOString()).toBe("2026-11-22T21:01:00.000Z");
  });

  it("renders audit detail JSON as plain text", () => {
    expect(formatDetail('{"reason":"<img src=x onerror=alert(1)>","n":2}')).toBe("reason: <img src=x onerror=alert(1)> · n: 2");
    expect(formatDetail("not json")).toBe("not json");
    expect(formatDetail(null)).toBe("");
  });
});
