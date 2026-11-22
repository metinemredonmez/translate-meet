import { describe, expect, it } from "vitest";
import en from "@/messages/en";
import tr from "@/messages/tr";
import { auditActionLabel, translate } from "@/lib/i18n";

function keys(obj: object, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefix}${k}`] : keys(v as object, `${prefix}${k}.`),
  );
}

describe("i18n", () => {
  it("TR and EN have the same keys and no empty strings", () => {
    expect(keys(en).sort()).toEqual(keys(tr).sort());
    for (const dict of [tr, en]) {
      for (const key of keys(dict)) {
        expect(translate(dict === tr ? "tr" : "en", key).trim()).not.toBe("");
      }
    }
  });

  it("interpolates variables and falls back to the key", () => {
    expect(translate("en", "common.pageOf", { page: 2, pages: 5 })).toBe("Page 2 of 5");
    expect(translate("tr", "does.not.exist")).toBe("does.not.exist");
  });

  it("labels audit actions and keeps unknown codes raw", () => {
    expect(auditActionLabel("tr", "user.disable")).toBe("Kullanıcı devre dışı");
    expect(auditActionLabel("en", "something.new")).toBe("something.new");
  });
});
