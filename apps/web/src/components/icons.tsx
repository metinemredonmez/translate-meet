import type { ReactNode, SVGProps } from "react";

/** Small inline stroke icons (no icon dependency). Decorative: always aria-hidden. */
function Svg({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

const PATHS: Record<string, ReactNode> = {
  converse: (
    <>
      <path d="M4 5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M19 9h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v3l-4-3h-3a2 2 0 0 1-2-2" />
    </>
  ),
  translate: (
    <>
      <path d="M4 5h8M8 3v2M6 5c0 4 2.5 7 5 8M10 5c-.5 3.5-3 7-6 8" />
      <path d="M13 21l4-10 4 10M14.5 17.5h5" />
    </>
  ),
  turkish: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </>
  ),
  rooms: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5M14 14.5c.9-.6 1.9-1 3-1 2.3 0 4 1.7 4.5 4.5" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  voice: (
    <>
      <path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h0" />
    </>
  ),
  offline: (
    <>
      <path d="M7 18h10a4 4 0 0 0 .8-7.9A6 6 0 0 0 6.3 9 4.5 4.5 0 0 0 7 18z" />
      <path d="M3 3l18 18" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  alert: (
    <>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v5M12 18h0" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return <Svg className={className}>{PATHS[name] ?? PATHS.converse}</Svg>;
}
