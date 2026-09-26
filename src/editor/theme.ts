import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

// All colors come from the CSS custom properties in styles/theme.css, so the
// editor follows the light/dark switch without being reconfigured.
export const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--md-on-surface)",
    backgroundColor: "transparent",
    fontSize: "14px",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--font-mono)",
    lineHeight: "1.7",
    overflow: "auto",
  },
  ".cm-content": {
    maxWidth: "760px",
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
    fontSize: "19px",
    lineHeight: "1.55",
  },
  "&.cm-live .cm-content": { maxWidth: "728px" },
  "&.cm-live .cm-md-mark": {
    fontFamily: "var(--font-mono)",
    fontSize: "0.79em",
    fontWeight: "400",
    fontStyle: "normal",
    color: "var(--md-primary)",
    opacity: "0.7",
  },
  "&.cm-live .cm-h": { fontWeight: "600", lineHeight: "1.2" },
  "&.cm-live .cm-h1": { fontSize: "46px", lineHeight: "1.1", letterSpacing: "-0.8px" },
  "&.cm-live .cm-h2": { fontSize: "28px", paddingTop: "20px" },
  "&.cm-live .cm-h3": { fontSize: "23px", paddingTop: "14px" },
  "&.cm-live .cm-h4, &.cm-live .cm-h5, &.cm-live .cm-h6": { fontSize: "20px", paddingTop: "8px" },
  "&.cm-live .cm-blank": { lineHeight: "12px", fontSize: "12px" },

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
  "&.cm-live .cm-task": { fontSize: "18px" },
  "&.cm-live .cm-task-done": { color: "var(--md-on-surface-variant)" },
  "&.cm-live .cm-task-box": {
    width: "18px",
    height: "18px",
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
    fontSize: "13px",
    padding: "4px 10px",
    borderRadius: "8px",
    color: "var(--md-on-surface-variant)",
    backgroundColor: "var(--md-surface-container)",
  },

  "&.cm-live .cm-codeblock": {
    fontFamily: "var(--font-mono)",
    fontSize: "14px",
    lineHeight: "1.7",
    backgroundColor: "var(--md-surface-low)",
    padding: "0 16px",
  },
  "&.cm-live .cm-codeblock-first": { borderRadius: "16px 16px 0 0", paddingTop: "6px", marginTop: "2px" },
  "&.cm-live .cm-codeblock-last": { borderRadius: "0 0 16px 16px", paddingBottom: "10px" },
  "&.cm-live .cm-codeblock-first.cm-codeblock-last": { borderRadius: "16px" },
  "&.cm-live .cm-codeblock-fence-hidden": { lineHeight: "6px", fontSize: "6px" },
  "&.cm-live .cm-code-header": {
    display: "inline-flex",
    alignItems: "center",
    width: "100%",
    fontFamily: "var(--font-ui)",
    marginRight: "-10px",
  },
  "&.cm-live .cm-code-lang": {
    flexGrow: "1",
    fontSize: "12px",
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
