import type { ServerMessage } from './realtime';

/** Bottom = the phone holder (speaks `langA`), top = the person opposite (speaks `langB`). */
export type Side = 'top' | 'bottom';

export interface CaptionLine {
  id: number;
  /** 'heard': what this side said (own language). 'forYou': translation addressed to this side. */
  kind: 'heard' | 'forYou';
  text: string;
}

export interface CaptionsState {
  top: CaptionLine[];
  bottom: CaptionLine[];
  partial: { side: Side; text: string } | null;
  quotaSeconds: number | null;
  nextId: number;
}

export const MAX_LINES = 30;

export const emptyCaptions: CaptionsState = { top: [], bottom: [], partial: null, quotaSeconds: null, nextId: 1 };

const other = (s: Side): Side => (s === 'top' ? 'bottom' : 'top');

function sideForLang(lang: string, langA: string, langB: string): Side {
  const l = lang.toLowerCase();
  if (l === langB.toLowerCase() && l !== langA.toLowerCase()) return 'top';
  return 'bottom';
}

function push(lines: CaptionLine[], line: CaptionLine): CaptionLine[] {
  const next = [...lines, line];
  return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next;
}

export function reduceCaptions(
  state: CaptionsState,
  msg: ServerMessage,
  langs: { langA: string; langB: string },
): CaptionsState {
  switch (msg.type) {
    case 'partial_caption':
      return { ...state, partial: { side: sideForLang(msg.lang, langs.langA, langs.langB), text: msg.text } };
    case 'final_caption': {
      const speaker = sideForLang(msg.source_lang, langs.langA, langs.langB);
      const listener = other(speaker);
      const id = state.nextId;
      const s = { ...state, partial: null, nextId: id + 2 };
      s[speaker] = push(state[speaker], { id, kind: 'heard', text: msg.source_text });
      s[listener] = push(state[listener], { id: id + 1, kind: 'forYou', text: msg.translated_text });
      return s;
    }
    case 'quota_update':
      return { ...state, quotaSeconds: msg.realtime_seconds_remaining };
    default:
      return state;
  }
}
