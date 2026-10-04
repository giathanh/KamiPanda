import DOMPurify from "dompurify";
import { marked } from "marked";

// Sanitize after Markdown parsing, at every boundary into the app DOM.
function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "form", "button", "textarea", "select", "option"],
    FORBID_ATTR: ["style", "id", "name"],
    ALLOW_DATA_ATTR: false,
  });
}

export function renderMarkdown(source: string): string {
  return sanitize(marked.parse(source, { gfm: true, async: false }));
}

export function renderInlineMarkdown(source: string): string {
  return sanitize(marked.parseInline(source, { gfm: true, async: false }));
}
