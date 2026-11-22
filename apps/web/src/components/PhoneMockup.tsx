import type { Dictionary } from "@/i18n";
import { Icon } from "./icons";

type Mockup = Dictionary["home"]["mockup"];

/**
 * Converse split screen drawn with HTML/CSS (no screenshots, no stock images).
 * Adapted from the design kit's phone-frame showcase: the frame keeps a fixed aspect ratio so
 * nothing shifts while loading. The top half is rotated 180° because it faces the person on the
 * other side of the table. Exposed to assistive tech as one image with a descriptive label.
 */
export function PhoneMockup({ m, className = "" }: { m: Mockup; className?: string }) {
  return (
    <div role="img" aria-label={m.ariaLabel} className={`relative ${className}`}>
      {/* soft glow behind the phone */}
      <div aria-hidden="true" className="absolute -inset-8 -z-10 rounded-full bg-accent/25 blur-3xl" />
      <div aria-hidden="true" className="rounded-[2.6rem] bg-foreground p-2.5 shadow-2xl ring-1 ring-border">
        <div className="relative flex aspect-[9/19] w-full flex-col overflow-hidden rounded-[2.1rem] bg-background">
          {/* status strip + island */}
          <div className="flex h-7 shrink-0 items-center justify-center">
            <div className="h-4 w-16 rounded-full bg-foreground" />
          </div>

          {/* Top half — faces the other person (rotated) */}
          <div className="flex flex-1 rotate-180 flex-col gap-2 px-3 pt-3 pb-2">
            <Half
              lang={m.topLang}
              translatedLabel={m.topTranslatedLabel}
              translatedText={m.topTranslatedText}
              heardLabel={m.topHeardLabel}
              heardText={m.topHeardText}
              lead="translated"
            />
          </div>

          {/* Center bar */}
          <div className="flex shrink-0 items-center justify-between border-y border-border bg-surface px-3 py-2">
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted">{m.pair}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary shadow">
              <Icon name="mic" className="h-4 w-4" />
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {m.listening}
            </span>
          </div>

          {/* Bottom half — faces you */}
          <div className="flex flex-1 flex-col gap-2 px-3 pt-3 pb-4">
            <Half
              lang={m.bottomLang}
              translatedLabel={m.bottomTranslatedLabel}
              translatedText={m.bottomTranslatedText}
              heardLabel={m.bottomHeardLabel}
              heardText={m.bottomHeardText}
              lead="heard"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Half(props: {
  lang: string;
  translatedLabel: string;
  translatedText: string;
  heardLabel: string;
  heardText: string;
  lead: "heard" | "translated";
}) {
  const heard = (
    <div key="heard" className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-border bg-surface px-3 py-2">
      <p className="text-[9px] font-semibold tracking-wide text-muted uppercase">{props.heardLabel}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted">{props.heardText}</p>
    </div>
  );
  const translated = (
    <div key="translated" className="max-w-[90%] rounded-2xl rounded-bl-md bg-primary px-3 py-2 text-on-primary">
      <p className="text-[9px] font-semibold tracking-wide uppercase opacity-80">{props.translatedLabel}</p>
      <p className="mt-0.5 text-[13px] leading-snug font-medium">{props.translatedText}</p>
    </div>
  );
  return (
    <>
      <span className="self-start rounded-full bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-foreground ring-1 ring-border">
        {props.lang}
      </span>
      <div className="flex flex-1 flex-col justify-end gap-2">
        {props.lead === "heard" ? [heard, translated] : [translated, heard]}
      </div>
    </>
  );
}
