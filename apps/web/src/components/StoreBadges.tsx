/**
 * Store badges in "coming soon" state (adapted from the kit's store-badge part).
 * Deliberately NOT links and NOT the official Apple/Google badge artwork: an unclickable
 * store badge would be misleading and against the stores' badge guidelines. When real
 * listing URLs exist, replace these with the official badges linking to them.
 */
export function StoreBadges({
  stores,
  soon,
  label,
  className = "",
}: {
  stores: string[];
  soon: string;
  label: string;
  className?: string;
}) {
  return (
    <ul aria-label={label} className={`flex flex-wrap gap-3 ${className}`}>
      {stores.map((store) => (
        <li
          key={store}
          className="flex min-w-44 flex-col items-start rounded-xl border border-dashed border-border bg-surface px-5 py-3 text-left"
        >
          <span className="text-lg font-semibold text-foreground">{store}</span>
          <span className="text-xs font-semibold tracking-wide text-muted uppercase">{soon}</span>
        </li>
      ))}
    </ul>
  );
}
