/** Pure text helpers shared by the provider, the turn loop, and tests. No server-only imports. */

export const BUBBLE_SOFT_MAX = 420;

/** Split a reply into at most two iMessage bubbles at a paragraph boundary. */
/** Where the model wrote a placeholder ("[link]", "{{link}}", "<link>") put the real URL; otherwise add it at the end. */
export function placeLink(reply: string, url: string): string {
  if (reply.includes(url)) return reply.replace(/\n{3,}/g, "\n\n").trim();
  const placeholder = /\[[^\]\n]*link[^\]\n]*\]|\{\{[^}\n]*\}\}|<[^>\n]*link[^>\n]*>/gi;
  const placed = placeholder.test(reply) ? reply.replace(placeholder, url) : `${reply.trim()}\n\n${url}`;
  return placed.replace(/\n{3,}/g, "\n\n").trim();
}

export function splitBubbles(text: string, softMax = BUBBLE_SOFT_MAX): string[] {
  const t = text.trim();
  if (!t) return [];
  if (t.length <= softMax) return [t];
  const paras = t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paras.length < 2) return [t];
  let first = "";
  let i = 0;
  while (i < paras.length && (first + "\n\n" + paras[i]).trim().length <= softMax) {
    first = (first ? first + "\n\n" : "") + paras[i];
    i++;
  }
  if (!first) {
    first = paras[0];
    i = 1;
  }
  const rest = paras.slice(i).join("\n\n");
  return rest ? [first, rest] : [first];
}

/** Strip markdown the model may slip in; iMessage renders none of it. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(^|\s)\*(?!\s)(.+?)\*(?=\s|$|[.,!?])/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-•]\s+/gm, "• ")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 $2")
    .trim();
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return /^\+\d{8,15}$/.test(digits) ? digits : null;
  if (/^1\d{10}$/.test(digits)) return `+${digits}`;
  if (/^\d{10}$/.test(digits)) return `+1${digits}`;
  return null;
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86400000);
}

export function isoDate(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
