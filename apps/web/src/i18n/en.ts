import type { Dictionary } from "./tr";

/**
 * English dictionary. Must have exactly the same key set as tr.ts
 * (enforced by the Dictionary type and tests/dictionaries.test.ts).
 */
export const en: Dictionary = {
  meta: {
    siteName: "Translate Meet",
    ogLocale: "en_US",
    defaultDescription:
      "Translate Meet: Turkish-first live conversation and text translation. Put the phone between you and let everyone speak their own language.",
  },
  common: {
    skipToContent: "Skip to content",
    primaryNav: "Main menu",
    homeLink: "Translate Meet home",
    switchLanguage: "Türkçe",
    switchLanguageLabel: "This page in Turkish",
    comingSoon: "Coming soon",
    firstRelease: "First release",
    backHome: "Back to home",
  },
  nav: {
    features: "Features",
    how: "How it works",
    data: "Your data",
    faq: "FAQ",
  },
  home: {
    metaTitle: "Translate Meet — Turkish-first live translation",
    metaDescription:
      "Two people, two languages, one phone. Translate Meet delivers what you say as captions and speech in the other person's language; text translation is processed in Türkiye first.",
    hero: {
      eyebrow: "A Turkish-first translation app",
      title: "Put the phone between you. Everyone speaks their own language.",
      lead: "Translate Meet delivers what you say as captions and speech in the other person's language. The screen splits in two: the bottom half is yours, the top half faces the person opposite you.",
      ctaPrimary: "How does it work?",
      ctaSecondary: "What happens to your data?",
      storeNote: "Coming soon to the App Store and Google Play.",
    },
    mockup: {
      ariaLabel:
        "Example of the Translate Meet conversation screen: the top half faces the other person in English, the bottom half faces you in Turkish.",
      topLang: "English",
      topTranslatedLabel: "Translation",
      topTranslatedText: "Could we move the meeting to Tuesday at three?",
      topHeardLabel: "You said",
      topHeardText: "Yes, Tuesday at three works for me.",
      bottomLang: "Türkçe",
      bottomHeardLabel: "Siz",
      bottomHeardText: "Toplantıyı salı saat üçe alabilir miyiz?",
      bottomTranslatedLabel: "Çeviri",
      bottomTranslatedText: "Evet, salı saat üç benim için uygun.",
      pair: "TR ⇄ EN",
      listening: "Dinleniyor…",
    },
    features: {
      title: "What you can do",
      lead: "The first release is built around two core jobs: face-to-face conversation and text translation. The rest is on the roadmap.",
      items: [
        {
          id: "converse",
          status: "live",
          title: "Live conversation",
          body: "Two people talk over one phone. The app detects the spoken language, shows the translation as captions on the other person's half and reads it aloud.",
        },
        {
          id: "translate",
          status: "live",
          title: "Text translation",
          body: "Type or paste, then copy the result. Text translation is processed first by a provider running in Türkiye.",
        },
        {
          id: "turkish",
          status: "live",
          title: "Turkish first",
          body: "Interface and quality work start from Turkish; the first language pair is Turkish ⇄ English, with more languages added step by step.",
        },
        {
          id: "rooms",
          status: "soon",
          title: "Meeting rooms",
          body: "Join a room with a QR code; everyone speaks their own language and reads captions in their own language.",
        },
        {
          id: "camera",
          status: "soon",
          title: "Camera translation",
          body: "Point the camera at a sign, a menu or a document and read the text in your language.",
        },
        {
          id: "voice",
          status: "soon",
          title: "In your own voice",
          body: "Hear the translation in a voice that resembles yours. It will be an optional feature, enabled only with your separate, explicit consent.",
        },
        {
          id: "offline",
          status: "soon",
          title: "Offline",
          body: "Downloadable language packs for basic text translation when there is no internet connection.",
        },
      ],
    },
    how: {
      title: "How it works",
      lead: "Three steps from install to the first sentence.",
      steps: [
        {
          title: "Pick the languages",
          body: "Open the app and choose your language and the other person's language.",
        },
        {
          title: "Put the phone between you",
          body: "The screen splits in two. The bottom half faces you, the top half faces the other person.",
        },
        {
          title: "Take turns speaking",
          body: "What you say appears on the other person's half as captions and speech in their language. For anything important, especially numbers and dates, double-check the captions.",
        },
      ],
    },
    data: {
      title: "Your data",
      lead: "You trust a translation app with your voice and your words. We spell out what goes where.",
      points: [
        {
          title: "Text translation runs in Türkiye first",
          body: "Text translation is processed first by İşNet's Gao Kaptan service in Türkiye. If Kaptan cannot respond, fallback providers (Google Gemini, OpenAI, Anthropic Claude, Moonshot Kimi) are used; these are outside Türkiye.",
        },
        {
          title: "Raw audio is not stored by default",
          body: "In live conversation your voice is streamed to the provider (Google Gemini Live Translate or ElevenLabs) only to translate it; no raw audio recording is kept on our servers.",
        },
        {
          title: "Your history is yours",
          body: "Your text translation history is tied to your account only. When you delete your account, the history is deleted too.",
        },
        {
          title: "Admins don't see content",
          body: "The admin panel shows usage counts; it does not show the texts you translate or your conversations.",
        },
      ],
      cta: "Read the draft privacy policy",
    },
    download: {
      title: "Coming soon to the stores",
      lead: "The app is not released yet. Store links will appear here on launch day.",
      appStore: "App Store",
      googlePlay: "Google Play",
      listLabel: "App stores",
    },
    faqPreview: {
      title: "Frequently asked",
      more: "See all questions",
    },
  },
  faq: {
    metaTitle: "Frequently asked questions",
    metaDescription:
      "Frequently asked questions about Translate Meet: languages, audio recording, where data is processed, meeting rooms and account deletion.",
    title: "Frequently asked questions",
    lead: "If your question is not here, a contact address will be added to this page before launch.",
    relatedLink: "Related page",
    items: [
      {
        id: "what",
        q: "What is Translate Meet?",
        a: "A Turkish-first mobile app that translates face-to-face conversations and text. You put the phone between two people; each half of the screen faces one person, and what is said appears as captions and speech in the other person's language.",
      },
      {
        id: "languages",
        q: "Which languages are supported?",
        a: "The first language pair is Turkish ⇄ English. Arabic, German and other languages will be added step by step as they pass quality testing.",
      },
      {
        id: "audio",
        q: "Are my conversations recorded?",
        a: "Not by default. In live conversation the audio is streamed to the provider only for translation; no raw audio is stored on our servers. If a recording or minutes feature arrives later, it will only run when you turn it on and will be clearly visible on screen.",
      },
      {
        id: "where",
        q: "Where are my translations processed?",
        a: "Text translation is processed first by İşNet's Gao Kaptan service in Türkiye; if it is unavailable, Google Gemini, OpenAI, Anthropic Claude and Moonshot Kimi are used as fallbacks, in that order. Live speech translation runs on Google Gemini Live Translate and ElevenLabs (speech-to-text and text-to-speech). Transfers to providers outside Türkiye are described in the KVKK information notice.",
      },
      {
        id: "admins",
        q: "Can anyone else see my translations?",
        a: "Your text translation history is tied to your account only. Admins see usage counts only, not content.",
      },
      {
        id: "interpreter",
        q: "Does it replace a professional interpreter?",
        a: "No. Machine translation can make mistakes; double-check the captions, especially numbers, dates and negations. Use a professional interpreter for medical, legal and official matters.",
      },
      {
        id: "rooms",
        q: "When are meeting rooms coming?",
        a: "Coming soon. You will join a room with a QR code or a link; each participant picks their own language and reads captions in it.",
      },
      {
        id: "voice",
        q: "What about speaking in my own voice?",
        a: "It is an optional feature coming later. Your voice sample will not be processed without separate, explicit consent, and a separate information notice will be published for it.",
      },
      {
        id: "download",
        q: "Where can I download the app?",
        a: "The app is not released yet. App Store and Google Play links will be shared on this site on launch day.",
      },
      {
        id: "delete",
        q: "How do I delete my account?",
        a: "In the app, go to Settings → Delete account. Your text translation history is deleted together with your account. Details are on the account deletion page.",
      },
    ],
  },
  footer: {
    tagline: "Turkish-first live translation.",
    productHeading: "Product",
    legalHeading: "Legal",
    noTracking: "This site uses no cookies, analytics or tracking.",
    rights: "© {year} Translate Meet",
  },
  legal: {
    eyebrow: "Legal",
    draftBanner: "DRAFT — pending legal review",
    draftNote:
      "This text is a pre-launch draft awaiting legal review. Fields in square brackets (such as [Company name]) have not been filled in yet.",
    draftDate: "Draft date: {date}",
    toc: "On this page",
    otherDocs: "Other legal documents",
    docs: {
      privacy: {
        navLabel: "Privacy",
        metaTitle: "Privacy policy (draft)",
        metaDescription:
          "Draft Translate Meet privacy policy: which data is processed by which provider, retention, cross-border transfer and your rights.",
        title: "Privacy policy",
        intro:
          "This policy explains how the Translate Meet mobile app and this website process your personal data.",
        sections: [
          {
            heading: "Data controller",
            paragraphs: [
              "The data controller is [Company name] ([Address], MERSIS: [MERSIS number]). For any privacy question, write to [Contact e-mail].",
            ],
          },
          {
            heading: "Data we process",
            paragraphs: ["When you use the app we process only the data needed for the service:"],
            items: [
              "Account: the user identifier provided by Apple or Google at sign-in, your e-mail address if you choose to share it, and your app language preference.",
              "Session: hashes of the tokens used to refresh your session (not the tokens themselves).",
              "Usage: daily usage amounts for quota purposes (e.g. seconds of conversation, characters translated).",
              "Text translation: the text you translate, the result, the language pair and the name of the provider that translated it. This record is your history.",
              "Live conversation: microphone audio is streamed to the provider in real time for translation. Raw audio and captions are not stored on our servers by default.",
              "Technical logs: error and security logs contain only identifiers and error codes; audio, captions, translated text and session tokens are never written to logs.",
            ],
          },
          {
            heading: "Purposes",
            items: [
              "Providing the translation service (live conversation and text translation).",
              "Managing your account and session securely.",
              "Enforcing usage quotas and preventing abuse.",
              "Showing you your own translation history.",
              "Meeting legal obligations.",
            ],
          },
          {
            heading: "Service providers and transfers",
            paragraphs: ["To translate, your content is sent to the following providers:"],
            items: [
              "Gao Kaptan (İşNet) — primary provider for text translation. Data is processed in Türkiye.",
              "Google Gemini — first fallback for text translation; speech translation in live conversation via Gemini Live Translate. Outside Türkiye, processing location: [to be confirmed].",
              "OpenAI — fallback for text translation. Outside Türkiye, processing location: [to be confirmed].",
              "Anthropic (Claude) — fallback for text translation. Outside Türkiye, processing location: [to be confirmed].",
              "Moonshot AI (Kimi) — last fallback for text translation. Outside Türkiye, processing location: [to be confirmed].",
              "ElevenLabs — speech-to-text and text-to-speech in live conversation. Outside Türkiye, processing location: [to be confirmed].",
              "Apple and Google — sign-in (authentication) only.",
              "Hosting: [Hosting provider and location].",
            ],
          },
          {
            heading: "Cross-border transfer",
            paragraphs: [
              "The fallback text translation providers and the live conversation providers are outside Türkiye. Content sent to them is transferred abroad within the meaning of Article 9 of the Turkish Personal Data Protection Law No. 6698 (KVKK). Legal basis for the transfer: [to be determined by legal — e.g. standard contract]. Where possible, EU regions and zero data retention options are preferred when choosing providers.",
            ],
          },
          {
            heading: "Retention",
            items: [
              "Account data: while your account is open; deleted when the account is deleted.",
              "Text translation history: while your account is open; deleted when the account is deleted.",
              "Raw audio and live captions: not stored by default.",
              "Usage records: deleted when the account is deleted; for records subject to a legal retention duty: [Retention period].",
              "Technical and security logs: [Retention period].",
              "Retention on the providers' side: according to provider agreements, [to be confirmed].",
            ],
          },
          {
            heading: "Admin access",
            paragraphs: [
              "The admin panel shows per-user usage counts. The texts you translate, your conversations and your captions are not shown in the panel.",
            ],
          },
          {
            heading: "Your rights",
            paragraphs: [
              "Your rights under Article 11 of the KVKK (access, rectification, erasure, objection and others) are described in detail in the KVKK information notice. You can delete your account from within the app at any time.",
            ],
          },
          {
            heading: "Cookies and analytics",
            paragraphs: [
              "This website uses no non-essential cookies, analytics, advertising or tracking code, and loads no third-party scripts, fonts or images. That is why there is no cookie consent banner. If measurement is ever added, this policy will be updated first and your consent will be asked.",
            ],
          },
          {
            heading: "Voice data and future features",
            paragraphs: [
              "Today raw audio is used only for real-time translation and is not stored. The future \"in your own voice\" (voice clone) feature will be optional; your voice sample will not be processed without your separate, explicit consent, and a separate information notice and separate deletion control will be provided for it.",
            ],
          },
          {
            heading: "Age limit",
            paragraphs: ["The app is not designed for people under [Age limit]."],
          },
          {
            heading: "Changes and contact",
            paragraphs: [
              "When we update this policy we change its date and announce significant changes in the app. Questions: [Contact e-mail].",
            ],
          },
        ],
      },
      terms: {
        navLabel: "Terms of use",
        metaTitle: "Terms of use (draft)",
        metaDescription:
          "Draft Translate Meet terms of use: scope of the service, account, acceptable use and the limits of translation accuracy.",
        title: "Terms of use",
        intro:
          "These terms govern your use of the Translate Meet mobile app and this website. By using the app you accept these terms.",
        sections: [
          {
            heading: "Parties",
            paragraphs: [
              "The service is provided by [Company name] ([Address], MERSIS: [MERSIS number]). Contact: [Contact e-mail].",
            ],
          },
          {
            heading: "Scope of the service",
            paragraphs: [
              "Translate Meet offers live conversation translation and text translation. Meeting rooms, camera translation, speaking in your own voice and offline use are not offered yet; these terms will be updated when they arrive.",
            ],
          },
          {
            heading: "Account",
            paragraphs: [
              "You sign in with your Apple or Google account. You are responsible for the security of your account and for usage made through it.",
            ],
          },
          {
            heading: "Acceptable use",
            items: [
              "Tell the person opposite you that you are using a translation app; they should know the conversation is being translated by an app.",
              "Do not use the service to infringe the rights of others or to create or spread unlawful content.",
              "Do not try to bypass quotas, reverse-engineer the service or overload its systems.",
            ],
          },
          {
            heading: "Translation accuracy",
            paragraphs: [
              "Translations are machine-generated and may contain errors; meaning can shift especially in names, numbers, dates and negations. Translate Meet does not replace a professional interpreter. For medical, legal, financial and official matters, get professional help before relying on a translation.",
            ],
          },
          {
            heading: "Quotas and pricing",
            paragraphs: [
              "The service is offered with daily usage quotas. Paid plans and prices: [Pricing terms — to be determined]. For purchases made through an app store, that store's terms also apply.",
            ],
          },
          {
            heading: "Intellectual property",
            paragraphs: [
              "The app, the brand and the site content belong to [Company name]. You keep your rights in the texts you translate and in the translation results.",
            ],
          },
          {
            heading: "Limitation of liability",
            paragraphs: [
              "To the extent permitted by applicable law, we are not liable for indirect damages arising from translation errors or service interruptions. [Liability limits to be clarified by legal.]",
            ],
          },
          {
            heading: "Termination and account deletion",
            paragraphs: [
              "You can delete your account at any time in the app via Settings → Delete account. We may suspend or close an account in case of a serious breach of these terms.",
            ],
          },
          {
            heading: "Changes and governing law",
            paragraphs: [
              "When we update the terms we announce significant changes in the app. These terms are governed by the laws of the Republic of Türkiye; [Competent courts and enforcement offices] have jurisdiction over disputes. Your statutory rights as a consumer are reserved.",
            ],
          },
        ],
      },
      kvkk: {
        navLabel: "KVKK notice",
        metaTitle: "KVKK information notice (draft)",
        metaDescription:
          "Draft Translate Meet information notice under the Turkish Personal Data Protection Law (KVKK): data processed, purposes, legal bases, transfers and Article 11 rights.",
        title: "KVKK information notice",
        intro:
          "Under Article 10 of the Turkish Personal Data Protection Law No. 6698 (KVKK), we inform you about the processing of your personal data.",
        sections: [
          {
            heading: "Data controller",
            paragraphs: [
              "[Company name], [Address], MERSIS: [MERSIS number], e-mail: [Contact e-mail].",
            ],
          },
          {
            heading: "Categories of personal data processed",
            items: [
              "Identity and contact: Apple/Google user identifier, e-mail address if you share it.",
              "Customer transactions: text translation history (source text, translation, language pair, provider), language preference, usage amounts.",
              "Transaction security: session token hashes, identifiers and codes in error and security logs.",
              "Audio: microphone audio in live conversation — processed only for real-time translation, not stored by default.",
            ],
          },
          {
            heading: "Purposes of processing",
            items: [
              "Providing the translation service and performing the contract.",
              "Ensuring account and session security.",
              "Enforcing usage quotas and preventing abuse.",
              "Meeting legal obligations and informing competent authorities.",
            ],
          },
          {
            heading: "Legal bases",
            paragraphs: [
              "Your personal data is processed on the legal bases of KVKK Art. 5/2-c (establishment and performance of a contract), Art. 5/2-ç (legal obligation) and Art. 5/2-f (legitimate interest). The basis for cross-border transfer is stated separately below.",
              "For the future voice clone feature, a voice sample may qualify as biometric (special category) data to the extent it is processed to identify a person; that feature will only run with your separate explicit consent under KVKK Art. 6 and with a separate information notice.",
            ],
          },
          {
            heading: "Method of collection",
            paragraphs: [
              "Data is collected electronically and automatically through the mobile app: from Apple/Google at sign-in, and directly from you during use.",
            ],
          },
          {
            heading: "Transfers",
            items: [
              "Within Türkiye: Gao Kaptan (İşNet) for text translation.",
              "Abroad: Google Gemini, OpenAI, Anthropic Claude and Moonshot Kimi for fallback text translation; Google Gemini Live Translate and ElevenLabs for live speech translation; Apple and Google for sign-in. Hosting: [Hosting provider and location].",
              "Transfers abroad are made under KVKK Art. 9. Basis: [to be determined by legal — e.g. standard contract and notification to the Board].",
              "To legally authorised public institutions, upon request and to the extent required by law.",
            ],
          },
          {
            heading: "Your rights under KVKK Art. 11",
            paragraphs: ["By applying to the data controller you can:"],
            items: [
              "learn whether your personal data is processed,",
              "request information if it has been processed,",
              "learn the purpose of processing and whether it is used accordingly,",
              "know the third parties in Türkiye or abroad to whom it is transferred,",
              "request rectification if it is incomplete or inaccurate,",
              "request erasure or destruction under the conditions of KVKK Art. 7,",
              "request that rectification, erasure or destruction be notified to the third parties it was transferred to,",
              "object to a result against you arising exclusively from analysis by automated systems,",
              "claim compensation if you suffer damage due to unlawful processing.",
            ],
          },
          {
            heading: "How to apply",
            paragraphs: [
              "You can submit your request in writing to [Contact e-mail] or to [Address], in line with the Communiqué on the Procedures and Principles of Application to the Data Controller. Your request will be concluded free of charge within 30 days at the latest; if the action requires an additional cost, the tariff set by the Board may apply.",
            ],
          },
        ],
      },
      deletion: {
        navLabel: "Account deletion",
        metaTitle: "Account deletion",
        metaDescription:
          "How to delete your Translate Meet account in the app or by e-mail, and which data is removed after deletion.",
        title: "Account deletion",
        intro:
          "You can delete your Translate Meet account and the data tied to it at any time. Uninstalling the app does not delete the account.",
        sections: [
          {
            heading: "In the app",
            ordered: true,
            items: [
              "Open the Translate Meet app and sign in.",
              "Go to the Settings tab.",
              "Tap Delete account and confirm.",
            ],
          },
          {
            heading: "By e-mail",
            paragraphs: [
              "If you cannot access the app, send an e-mail with the subject \"Account deletion request\" from the e-mail address linked to your account to [Contact e-mail]. We may ask for additional information to verify the account is yours. Your request will be concluded within [X days] at the latest.",
            ],
          },
          {
            heading: "Data that is deleted",
            items: [
              "Your account data (sign-in provider identifier, e-mail, language preference).",
              "Session tokens; you are signed out on all devices.",
              "Your text translation history.",
              "Your usage records.",
            ],
          },
          {
            heading: "Data that may remain",
            paragraphs: [
              "Raw audio is not stored, so there is no audio recording to delete. Records that must be kept by law (if any) are kept for [Retention period] and then deleted. Retention on the providers' side is described in the privacy policy.",
            ],
          },
          {
            heading: "Apple or Google connection",
            paragraphs: [
              "If you signed in with Apple or Google, after deleting the account you can also remove the Translate Meet connection in that account's settings.",
            ],
          },
        ],
      },
    },
  },
  notFound: {
    metaTitle: "Page not found",
    title: "This page could not be found",
    body: "The address you are looking for may have moved or may never have existed.",
    home: "Back to home",
  },
};
