/**
 * Converts blog registry markdown to HTML for dangerouslySetInnerHTML.
 * Supports paragraphs, ## / ### headings, bold, links, ordered and unordered lists, and task list items.
 */
export function convertMarkdownToHtml(markdown: string): string {
  const lines = markdown.trim().split("\n");
  const out: string[] = [];
  let i = 0;
  const para: string[] = [];

  function formatInline(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
  }

  function flushPara() {
    if (para.length === 0) return;
    out.push(`<p>${formatInline(para.join(" "))}</p>`);
    para.length = 0;
  }

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      flushPara();
      i += 1;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushPara();
      out.push(`<h2>${formatInline(trimmed.slice(3))}</h2>`);
      i += 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushPara();
      out.push(`<h3>${formatInline(trimmed.slice(4))}</h3>`);
      i += 1;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t) break;
        const ul = t.match(/^-\s+(.*)$/);
        if (!ul) break;
        const inner = ul[1];
        const cb = inner.match(/^\[([ xX])\]\s+(.*)$/);
        if (cb) {
          items.push(
            `<li class="blog-task-item" data-checked="${cb[1].toLowerCase() === "x" ? "true" : "false"}">${formatInline(cb[2])}</li>`
          );
        } else {
          items.push(`<li>${formatInline(inner)}</li>`);
        }
        i += 1;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (!t) break;
        const m = t.match(/^\d+\.\s+(.*)$/);
        if (!m) break;
        items.push(`<li>${formatInline(m[1])}</li>`);
        i += 1;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    para.push(trimmed);
    i += 1;
  }

  flushPara();
  return out.join("\n");
}
