import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/navigation";

describe("safeNext", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeNext("/users?page=2")).toBe("/users?page=2");
    expect(safeNext("/users/abc")).toBe("/users/abc");
  });

  it.each([null, "", "https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/login", "/a\nb"])(
    "rejects %s",
    (value) => {
      expect(safeNext(value)).toBe("/");
    },
  );
});
