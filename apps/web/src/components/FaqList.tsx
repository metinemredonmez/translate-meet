import type { ReactNode } from "react";
import { Icon } from "./icons";

/** Native <details>/<summary> accordion: keyboard accessible, no client JS. */
export function FaqList({
  items,
  headingLevel = 2,
  className = "",
  renderExtra,
}: {
  items: { id: string; q: string; a: string }[];
  headingLevel?: 2 | 3;
  className?: string;
  renderExtra?: (id: string) => ReactNode;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={`divide-y divide-border rounded-2xl border border-border bg-surface-raised ${className}`}>
      {items.map((item) => (
        <details key={item.id} id={`q-${item.id}`} className="group px-5 py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
            <Heading className="text-base font-semibold text-foreground">{item.q}</Heading>
            <Icon name="arrow" className="h-4 w-4 shrink-0 rotate-90 text-muted transition-transform group-open:-rotate-90" />
          </summary>
          <div className="pb-5 leading-relaxed text-muted">
            <p>{item.a}</p>
            {renderExtra?.(item.id)}
          </div>
        </details>
      ))}
    </div>
  );
}
