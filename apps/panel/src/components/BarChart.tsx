"use client";

/**
 * Plain-SVG bar chart (no chart library; idea adapted from kit part 10's SVG trend chart).
 * Colours are token classes, the SVG has an accessible name, and the same numbers are
 * available to screen readers as a table.
 */
import { useId } from "react";

export interface BarDatum {
  label: string;
  value: number;
  /** Text shown on hover / to assistive tech, e.g. formatted value. */
  display: string;
}

const W = 640;
const H = 240;
const PAD = { top: 24, right: 12, bottom: 32, left: 12 };

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

export default function BarChart({
  data,
  ariaLabel,
  labelHeader,
  valueHeader,
}: {
  data: BarDatum[];
  ariaLabel: string;
  labelHeader: string;
  valueHeader: string;
}) {
  const titleId = useId();
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(56, slot * 0.6);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={titleId} className="h-auto w-full" preserveAspectRatio="xMidYMid meet">
        <title id={titleId}>{ariaLabel}</title>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + innerH * (1 - f)}
            y2={PAD.top + innerH * (1 - f)}
            className="stroke-border/50"
            strokeDasharray="4 4"
          />
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} className="stroke-border" />
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = PAD.left + slot * i + (slot - barW) / 2;
          const y = PAD.top + innerH - h;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={Math.max(h, d.value > 0 ? 2 : 0)} rx={4} className="fill-primary">
                <title>{`${d.label}: ${d.display}`}</title>
              </rect>
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="fill-fg text-[11px]">
                {d.display}
              </text>
              <text x={x + barW / 2} y={H - 10} textAnchor="middle" className="fill-fg-muted text-[11px]">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">{labelHeader}</th>
            <th scope="col">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.display}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
