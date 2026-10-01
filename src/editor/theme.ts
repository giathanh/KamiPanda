import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/** Scales a pixel size by the editor zoom level (set as --editor-zoom in data/settings.ts). */
const z = (px: number) => `calc(${px}px * var(--editor-zoom, 1))`;

// All colors come from the CSS custom properties in styles/theme.css, so the
// editor follows the light/dark switch without being reconfigured.
export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--md-on-surface)",
    backgroundColor: "transparent",
    fontSize: z(14),
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    lineHeight: "1.7",
    overflow: "auto",
  },
  ".cm-content": {
    maxWidth: z(760),
    margin: "0 auto",
    padding: "28px 24px 120px",
    caretColor: "var(--md-primary)",
    userSelect: "text",
  },
  ".cm-line": { padding: "0" },
  ".cm-cursor, .cm-dropCursor": { borderLeft: "2px solid var(--md-primary)" },
  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "color-mix(in srgb, var(--md-primary) 22%, transparent) !important",
  },

  // ---- Live preview -----------------------------------------------------
  "&.cm-live .cm-scroller": {
    fontFamily: "var(--font-doc)",
    fontSize: z(19),
    lineHeight: "1.55",
  },
  "&.cm-live .cm-content": { maxWidth: z(728) },
  "&.cm-live .cm-md-mark": {
    fontFamily: "var(--font-mono)",
    fontSize: "0.79em",
    fontWeight: "400",
    fontStyle: "normal",
    color: "var(--md-primary)",
    opacity: "0.7",
  },
  "&.cm-live .cm-h": { fontWeight: "600", lineHeight: "1.2" },
  "&.cm-live .cm-h1": { fontSize: z(46), lineHeight: "1.1", letterSpacing: "-0.8px" },
  "&.cm-live .cm-h2": { fontSize: z(28), paddingTop: "20px" },
  "&.cm-live .cm-h3": { fontSize: z(23), paddingTop: "14px" },
  "&.cm-live .cm-h4, &.cm-live .cm-h5, &.cm-live .cm-h6": { fontSize: z(20), paddingTop: "8px" },
  "&.cm-live .cm-blank": { lineHeight: z(12), fontSize: z(12) },

  "&.cm-live .cm-strong": { fontWeight: "700" },
  "&.cm-live .cm-em": { fontStyle: "italic" },
  "&.cm-live .cm-strike": { textDecoration: "line-through", color: "var(--md-on-surface-variant)" },
  "&.cm-live .cm-inline-code": {
    fontFamily: "var(--font-mono)",
    fontSize: "0.8em",
    padding: "2px 6px",
    borderRadius: "6px",
    backgroundColor: "var(--md-surface-low)",
  },
  "&.cm-live .cm-link": {
    color: "var(--md-primary)",
    textDecoration: "underline",
    textDecorationColor: "color-mix(in srgb, var(--md-primary) 40%, transparent)",
    textUnderlineOffset: "3px",
  },

  "&.cm-live .cm-bullet": { color: "var(--md-primary)", display: "inline-block", width: "1.1em" },
  "&.cm-live .cm-ordinal": { color: "var(--md-primary)", fontVariantNumeric: "tabular-nums" },
  "&.cm-live .cm-task": { fontSize: z(18) },
  "&.cm-live .cm-task-done": { color: "var(--md-on-surface-variant)" },
  "&.cm-live .cm-task-box": {
    width: z(18),
    height: z(18),
    margin: "0 12px 0 0",
    verticalAlign: "-3px",
    accentColor: "var(--md-primary)",
    cursor: "pointer",
  },

  "&.cm-live .cm-quote": {
    borderLeft: "3px solid var(--md-primary)",
    paddingLeft: "16px",
    color: "var(--md-on-surface-variant)",
  },
  "&.cm-live .cm-hr": {
    display: "inline-block",
    width: "100%",
    height: "1px",
    verticalAlign: "middle",
    backgroundColor: "var(--md-outline-variant)",
  },
  "&.cm-live .cm-image img": { maxWidth: "100%", borderRadius: "12px", verticalAlign: "top" },
  "&.cm-live .cm-image-missing": {
    fontFamily: "var(--font-ui)",
    fontSize: z(13),
    padding: "4px 10px",
    borderRadius: "8px",
    color: "var(--md-on-surface-variant)",
    backgroundColor: "var(--md-surface-container)",
  },

  "&.cm-live .cm-codeblock": {
    fontFamily: "var(--font-mono)",
    fontSize: z(14),
    lineHeight: "1.7",
    backgroundColor: "var(--md-surface-low)",
    padding: "0 16px",
  },
  "&.cm-live .cm-codeblock-first": { borderRadius: "16px 16px 0 0", paddingTop: "6px", marginTop: "2px" },
  "&.cm-live .cm-codeblock-last": { borderRadius: "0 0 16px 16px", paddingBottom: "10px" },
  "&.cm-live .cm-codeblock-first.cm-codeblock-last": { borderRadius: "16px" },
  "&.cm-live .cm-codeblock-fence-hidden": { lineHeight: z(6), fontSize: z(6) },
  "&.cm-live .cm-code-header": {
    display: "inline-flex",
    alignItems: "center",
    width: "100%",
    fontFamily: "var(--font-ui)",
    marginRight: "-10px",
  },
  "&.cm-live .cm-code-lang": {
    flexGrow: "1",
    fontSize: z(12),
    fontWeight: "600",
    letterSpacing: "0.4px",
    color: "var(--md-on-surface-variant)",
  },
  "&.cm-live .cm-code-copy": {
    width: "32px",
    height: "32px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--md-on-surface-variant)",
  },
  "&.cm-live .cm-code-copy:hover": { backgroundColor: "color-mix(in srgb, var(--md-on-surface) 8%, transparent)" },

  "&.cm-live .cm-table-wrap": {
    display: "grid",
    gridTemplateColumns: "minmax(0, max-content) 22px",
    gap: "4px",
    padding: "6px 0",
    fontFamily: "var(--font-ui)",
    fontSize: z(15),
    lineHeight: "1.45",
  },
  "&.cm-live .cm-table-scroll": { overflowX: "auto" },
  "&.cm-live .cm-table": {
    borderCollapse: "separate",
    borderSpacing: "0",
    border: "1px solid var(--md-outline-variant)",
    borderRadius: "12px",
    overflow: "hidden",
  },
  "&.cm-live .cm-table th, &.cm-live .cm-table td": {
    padding: "0",
    minWidth: "72px",
    verticalAlign: "top",
    borderRight: "1px solid var(--md-outline-variant)",
    borderBottom: "1px solid var(--md-outline-variant)",
  },
  "&.cm-live .cm-table tr > :last-child": { borderRight: "none" },
  "&.cm-live .cm-table tr:last-child > *": { borderBottom: "none" },
  "&.cm-live .cm-table th": { fontWeight: "600", backgroundColor: "var(--md-surface-low)" },
  "&.cm-live .cm-table-cell": { padding: "7px 12px", minHeight: "1.45em", outline: "none", cursor: "text", whiteSpace: "pre-wrap" },
  "&.cm-live .cm-table-cell:focus": {
    fontFamily: "var(--font-mono)",
    fontSize: z(13),
    boxShadow: "inset 0 0 0 2px var(--md-primary)",
    backgroundColor: "var(--md-surface-lowest)",
  },
  "&.cm-live .cm-table-cell code": {
    fontFamily: "var(--font-mono)",
    fontSize: "0.85em",
    padding: "1px 5px",
    borderRadius: "5px",
    backgroundColor: "var(--md-surface-container)",
  },
  "&.cm-live .cm-table-cell a": { color: "var(--md-primary)" },
  "&.cm-live .cm-table-add": {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "8px",
    padding: "0",
    fontFamily: "var(--font-ui)",
    fontSize: z(16),
    lineHeight: "1",
    color: "var(--md-on-surface-variant)",
    backgroundColor: "transparent",
    cursor: "pointer",
    opacity: "0",
    transition: "opacity 120ms, background-color 120ms",
  },
  "&.cm-live .cm-table-add-row": { height: "22px" },
  "&.cm-live .cm-table-wrap:hover .cm-table-add, &.cm-live .cm-table-wrap:focus-within .cm-table-add, &.cm-live .cm-table-add:focus-visible": {
    opacity: "1",
  },
  "&.cm-live .cm-table-add:hover": {
    color: "var(--md-primary)",
    backgroundColor: "color-mix(in srgb, var(--md-primary) 10%, transparent)",
  },
});

export const editorHighlight = syntaxHighlighting(
  HighlightStyle.define([
    // Markdown structure (visible as-is in Source mode).
    { tag: t.heading, fontWeight: "700" },
    { tag: t.heading1, fontSize: "1.3em" },
    { tag: t.strong, fontWeight: "700" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.strikethrough, textDecoration: "line-through" },
    { tag: [t.link, t.url], color: "var(--md-primary)" },
    { tag: [t.processingInstruction, t.contentSeparator], color: "var(--md-outline)" },
    { tag: t.quote, color: "var(--md-on-surface-variant)" },
    // Inline code / code block body: no tint, so nested-language colors show through.
    { tag: t.monospace, fontFamily: "var(--font-mono)" },
    // Code inside fenced blocks (parsed via @codemirror/language-data).
    { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword, t.modifier, t.self], color: "var(--code-keyword)" },
    { tag: [t.string, t.special(t.string), t.character, t.docString], color: "var(--code-string)" },
    { tag: [t.regexp, t.escape], color: "var(--code-property)" },
    { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], color: "var(--code-comment)", fontStyle: "italic" },
    { tag: [t.number, t.integer, t.float, t.bool, t.null, t.atom, t.unit], color: "var(--code-number)" },
    { tag: [t.function(t.variableName), t.function(t.propertyName), t.function(t.definition(t.variableName)), t.macroName], color: "var(--code-function)" },
    { tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: "var(--code-type)" },
    { tag: [t.propertyName, t.definition(t.propertyName)], color: "var(--code-property)" },
    { tag: [t.definition(t.variableName), t.special(t.variableName), t.standard(t.variableName), t.labelName], color: "var(--code-variable)" },
    { tag: [t.operator, t.punctuation, t.separator, t.bracket, t.derefOperator], color: "var(--code-operator)" },
    { tag: [t.tagName, t.angleBracket], color: "var(--code-tag)" },
    { tag: t.attributeName, color: "var(--code-attribute)" },
    { tag: t.attributeValue, color: "var(--code-string)" },
    { tag: t.meta, color: "var(--code-comment)" },
    { tag: t.invalid, color: "var(--md-error)" },
  ]),
);
