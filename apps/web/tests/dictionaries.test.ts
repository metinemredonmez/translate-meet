import { describe, expect, it } from "vitest";
import { en } from "@/i18n/en";
import { tr } from "@/i18n/tr";

/** Every leaf path, array indices included (so list lengths must match too). */
function leafPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => leafPaths(v, `${prefix}[${i}]`));
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => leafPaths(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

function leaves(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(leaves);
  if (value !== null && typeof value === "object") return Object.values(value).flatMap(leaves);
  return [value];
}

describe("dictionaries", () => {
  it("TR and EN have identical key sets", () => {
    const trKeys = leafPaths(tr).sort();
    const enKeys = leafPaths(en).sort();
    expect(trKeys.length).toBeGreaterThan(100);
    expect(enKeys).toEqual(trKeys);
  });

  it("has no empty strings", () => {
    for (const dict of [tr, en]) {
      for (const leaf of leaves(dict)) {
        if (typeof leaf === "string") expect(leaf.trim()).not.toBe("");
      }
    }
  });

  it("keeps non-text identifiers identical across languages", () => {
    expect(en.home.features.items.map((f) => [f.id, f.status])).toEqual(
      tr.home.features.items.map((f) => [f.id, f.status]),
    );
    expect(en.faq.items.map((f) => f.id)).toEqual(tr.faq.items.map((f) => f.id));
  });

  it("labels every not-yet-available feature as coming soon", () => {
    const soon = tr.home.features.items.filter((f) => f.status === "soon").map((f) => f.id);
    expect(soon).toEqual(["rooms", "camera", "voice", "offline"]);
    expect(tr.common.comingSoon).toBe("Yakında");
  });
});
