import { describe, expect, it } from "vitest";
import { tr } from "@/i18n/tr";
import { buildFaqJsonLd, serializeJsonLd } from "@/lib/jsonld";

describe("FAQ JSON-LD", () => {
  it("builds a valid FAQPage from the dictionary", () => {
    const data = buildFaqJsonLd(tr.faq.items, { inLanguage: "tr", url: "https://example.test/sss" });
    const parsed = JSON.parse(serializeJsonLd(data));

    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("FAQPage");
    expect(parsed.inLanguage).toBe("tr");
    expect(parsed.mainEntity).toHaveLength(tr.faq.items.length);
    parsed.mainEntity.forEach((q: Record<string, any>, i: number) => {
      expect(q["@type"]).toBe("Question");
      expect(q.name).toBe(tr.faq.items[i]!.q);
      expect(q.acceptedAnswer["@type"]).toBe("Answer");
      expect(q.acceptedAnswer.text).toBe(tr.faq.items[i]!.a);
    });
  });

  it("escapes < (and > &) so the payload cannot close the script tag", () => {
    const hostile = [{ q: "</script><script>alert(1)</script>", a: "a < b && c > d \u2028" }];
    const out = serializeJsonLd(buildFaqJsonLd(hostile, { inLanguage: "en", url: "https://example.test/en/faq" }));

    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(out).not.toContain("&");
    expect(out).not.toContain("\u2028");
    expect(out).toContain("\\u003c/script\\u003e");
    // still valid JSON that round-trips to the original strings
    const parsed = JSON.parse(out);
    expect(parsed.mainEntity[0].name).toBe(hostile[0]!.q);
    expect(parsed.mainEntity[0].acceptedAnswer.text).toBe(hostile[0]!.a);
  });
});
