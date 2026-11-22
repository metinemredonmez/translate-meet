import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it } from "vitest";
import EnHome from "@/app/(en)/en/page";
import EnDeletion from "@/app/(en)/en/account-deletion/page";
import EnFaq, { metadata as enFaqMeta } from "@/app/(en)/en/faq/page";
import EnKvkk from "@/app/(en)/en/kvkk-notice/page";
import EnPrivacy from "@/app/(en)/en/privacy/page";
import EnTerms from "@/app/(en)/en/terms/page";
import TrDeletion from "@/app/(tr)/hesap-silme/page";
import TrPrivacy, { metadata as trPrivacyMeta } from "@/app/(tr)/gizlilik/page";
import TrTerms from "@/app/(tr)/kullanim-sartlari/page";
import TrKvkk from "@/app/(tr)/kvkk-aydinlatma/page";
import TrHome from "@/app/(tr)/page";
import TrFaq from "@/app/(tr)/sss/page";
import { en } from "@/i18n/en";
import { tr } from "@/i18n/tr";

afterEach(cleanup);

const LEGAL: [string, ComponentType, string][] = [
  ["/gizlilik", TrPrivacy, tr.legal.draftBanner],
  ["/kullanim-sartlari", TrTerms, tr.legal.draftBanner],
  ["/kvkk-aydinlatma", TrKvkk, tr.legal.draftBanner],
  ["/hesap-silme", TrDeletion, tr.legal.draftBanner],
  ["/en/privacy", EnPrivacy, en.legal.draftBanner],
  ["/en/terms", EnTerms, en.legal.draftBanner],
  ["/en/kvkk-notice", EnKvkk, en.legal.draftBanner],
  ["/en/account-deletion", EnDeletion, en.legal.draftBanner],
];

describe("legal pages", () => {
  it.each(LEGAL)("%s renders the draft banner before the title", (_path, Page, banner) => {
    const { container } = render(<Page />);
    const bannerEl = screen.getByText(banner);
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    // banner comes first in document order
    expect(bannerEl.compareDocumentPosition(h1!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("note").contains(bannerEl)).toBe(true);
  });

  it("uses the exact banner wording", () => {
    expect(tr.legal.draftBanner).toBe("TASLAK — hukuk onayı bekliyor");
    expect(en.legal.draftBanner).toBe("DRAFT — pending legal review");
  });

  it("states that the site uses no cookies/analytics (no cookie banner)", () => {
    render(<TrPrivacy />);
    expect(screen.getByRole("heading", { name: /Çerezler ve analiz/ })).toBeTruthy();
  });
});

describe("home and FAQ", () => {
  it.each([
    ["tr", TrHome, tr],
    ["en", EnHome, en],
  ] as const)("%s home renders one h1, features, store badges and legal links", (_l, Page, d) => {
    const { container } = render(<Page />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: d.home.features.title })).toBeTruthy();
    expect(screen.getAllByText(d.common.comingSoon).length).toBeGreaterThanOrEqual(4 + 2);
    // no real store links yet
    expect(container.querySelector('a[href*="apps.apple.com"], a[href*="play.google.com"]')).toBeNull();
    for (const id of ["privacy", "terms", "kvkk", "deletion"] as const) {
      expect(screen.getAllByRole("link", { name: d.legal.docs[id].navLabel }).length).toBeGreaterThan(0);
    }
  });

  it.each([
    ["tr", TrFaq, tr],
    ["en", EnFaq, en],
  ] as const)("%s FAQ page embeds escaped FAQPage JSON-LD", (_l, Page, d) => {
    const { container } = render(<Page />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const data = JSON.parse(script!.innerHTML);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(d.faq.items.length);
    expect(script!.innerHTML).not.toContain("<");
  });
});

describe("metadata", () => {
  it("sets canonical and tr/en/x-default hreflang per page", () => {
    expect(trPrivacyMeta.alternates?.canonical).toBe("/gizlilik");
    expect(trPrivacyMeta.alternates?.languages).toEqual({ tr: "/gizlilik", en: "/en/privacy", "x-default": "/gizlilik" });
    expect(enFaqMeta.alternates?.canonical).toBe("/en/faq");
    expect(enFaqMeta.openGraph?.url).toBe("/en/faq");
  });
});
