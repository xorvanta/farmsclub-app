/**
 * Minimal, safe rendering model for admin-written FAQ answers. The admin form allows basic HTML
 * (notably <a href> links); RN Text can't render markup, and rendering raw HTML on web would be
 * an injection risk. So the answer is reduced to plain text runs plus links, entities decoded:
 *  - <a href="…">label</a> → a link, but only for http(s), mailto:, tel: or a site path ("/faqs")
 *  - <br>, </p>, </li>, </div> → line breaks; <li> → "• "
 *  - every other tag is dropped (its text kept)
 */
export type RichSegment = { text: string; href?: string };

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", bull: "•", rupee: "₹", copy: "©", reg: "®", trade: "™",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
    }
    return NAMED[code.toLowerCase()] ?? m;
  });
}

/** The link target if it's one we're willing to open, else null. */
export function safeHref(raw: string): string | null {
  const href = decodeEntities(raw).trim();
  if (/^https?:\/\/[^\s]+$/i.test(href)) return href;
  if (/^(mailto|tel):[^\s]+$/i.test(href)) return href;
  if (/^\/(?!\/)[^\s]*$/.test(href)) return href; // same-site path, not protocol-relative
  return null;
}

function textOf(html: string): string {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])\s*>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]*>/g, ""),
  );
}

export function parseRichText(html: string): RichSegment[] {
  const segments: RichSegment[] = [];
  const re = /<a\b[^>]*?\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a\s*>/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m.index > last) segments.push({ text: textOf(html.slice(last, m.index)) });
    const href = safeHref(m[2] ?? m[3] ?? m[4] ?? "");
    const label = textOf(m[5]).trim();
    if (label) segments.push(href ? { text: label, href } : { text: label });
    last = re.lastIndex;
  }
  if (last < html.length) segments.push({ text: textOf(html.slice(last)) });

  // Tidy whitespace across runs: collapse spaces, at most one blank line, trim the ends.
  const out = segments
    .map((s) => ({ ...s, text: s.text.replace(/[ \t\r\f\v]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n") }))
    .filter((s) => s.text.length > 0);
  if (out.length) {
    out[0] = { ...out[0], text: out[0].text.replace(/^\s+/, "") };
    const end = out.length - 1;
    out[end] = { ...out[end], text: out[end].text.replace(/\s+$/, "") };
  }
  return out.filter((s) => s.text.length > 0);
}
