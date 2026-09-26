import { syntaxTree } from "@codemirror/language";
import { EditorSelection, type EditorState } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";
import { focusTableCell } from "./table";

export type InlineKind = "bold" | "italic" | "code" | "strike";
export type BlockKind = "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const inline: Record<InlineKind, { node: string; mark: string; text: string }> = {
  bold: { node: "StrongEmphasis", mark: "EmphasisMark", text: "**" },
  italic: { node: "Emphasis", mark: "EmphasisMark", text: "*" },
  code: { node: "InlineCode", mark: "CodeMark", text: "`" },
  strike: { node: "Strikethrough", mark: "StrikethroughMark", text: "~~" },
};

export interface FormatState {
  bold: boolean;
  italic: boolean;
  code: boolean;
  strike: boolean;
  link: boolean;
  block: BlockKind;
}

function enclosing(state: EditorState, pos: number, name: string): SyntaxNode | null {
  for (const side of [-1, 1] as const) {
    for (let n: SyntaxNode | null = syntaxTree(state).resolveInner(pos, side); n; n = n.parent) {
      if (n.name === name) return n;
    }
  }
  return null;
}

export function formatState(state: EditorState): FormatState {
  const head = state.selection.main.head;
  const heading = /^(#{1,6})\s/.exec(state.doc.lineAt(head).text);
  return {
    bold: !!enclosing(state, head, "StrongEmphasis"),
    italic: !!enclosing(state, head, "Emphasis"),
    code: !!enclosing(state, head, "InlineCode"),
    strike: !!enclosing(state, head, "Strikethrough"),
    link: !!enclosing(state, head, "Link"),
    block: heading ? (`h${heading[1].length}` as BlockKind) : "p",
  };
}

export function toggleInline(view: EditorView, kind: InlineKind) {
  const { node: nodeName, mark, text } = inline[kind];
  const { state } = view;
  view.dispatch(
    state.changeByRange((range) => {
      const node = enclosing(state, range.from, nodeName);
      if (node) {
        const marks = node.getChildren(mark);
        const open = marks[0];
        const close = marks[marks.length - 1];
        if (open && close && open !== close) {
          const openLen = open.to - open.from;
          const shift = (p: number) => (p >= close.to ? p - openLen - (close.to - close.from) : p > open.from ? p - openLen : p);
          return {
            changes: [
              { from: open.from, to: open.to },
              { from: close.from, to: close.to },
            ],
            range: EditorSelection.range(shift(range.anchor), shift(range.head)),
          };
        }
      }
      return {
        changes: [
          { from: range.from, insert: text },
          { from: range.to, insert: text },
        ],
        range: EditorSelection.range(range.anchor + text.length, range.head + text.length),
      };
    }),
    { scrollIntoView: true, userEvent: "input.format" },
  );
  view.focus();
  return true;
}

function eachLine(view: EditorView, edit: (text: string) => string) {
  const { state } = view;
  const changes = [];
  const seen = new Set<number>();
  for (const r of state.selection.ranges) {
    for (let pos = r.from; pos <= r.to; ) {
      const line = state.doc.lineAt(pos);
      if (!seen.has(line.number)) {
        seen.add(line.number);
        const next = edit(line.text);
        if (next !== line.text) changes.push({ from: line.from, to: line.to, insert: next });
      }
      pos = line.to + 1;
    }
  }
  view.dispatch({ changes, userEvent: "input.format" });
  view.focus();
  return true;
}

const listPrefix = /^(\s*)([-*+] \[[ xX]\] |[-*+] |\d+[.)] )/;

export function setBlock(view: EditorView, block: BlockKind) {
  const level = block === "p" ? 0 : Number(block[1]);
  return eachLine(view, (text) => {
    const body = text.replace(/^#{1,6}\s+/, "");
    return level ? `${"#".repeat(level)} ${body}` : body;
  });
}

export function toggleList(view: EditorView, kind: "bullet" | "task") {
  const prefix = kind === "task" ? "- [ ] " : "- ";
  const matches = kind === "task" ? /^\s*[-*+] \[[ xX]\] / : /^\s*[-*+] (?!\[[ xX]\] )/;
  const lines = view.state.selection.ranges.flatMap((r) => {
    const out = [];
    for (let n = view.state.doc.lineAt(r.from).number; n <= view.state.doc.lineAt(r.to).number; n++) out.push(view.state.doc.line(n).text);
    return out;
  });
  const remove = lines.every((t) => matches.test(t));
  return eachLine(view, (text) => {
    if (remove) return text.replace(listPrefix, "$1");
    const m = listPrefix.exec(text);
    return m ? m[1] + prefix + text.slice(m[0].length) : prefix + text;
  });
}

/** Replace the selection with `before + selected + after`, then select `placeholder` if the selection was empty. */
function wrapWith(view: EditorView, build: (selected: string) => { text: string; select: [number, number] }) {
  const { state } = view;
  view.dispatch(
    state.changeByRange((range) => {
      const { text, select } = build(state.sliceDoc(range.from, range.to));
      return {
        changes: { from: range.from, to: range.to, insert: text },
        range: EditorSelection.range(range.from + select[0], range.from + select[1]),
      };
    }),
    { scrollIntoView: true, userEvent: "input.format" },
  );
  view.focus();
  return true;
}

export function insertLink(view: EditorView) {
  return wrapWith(view, (sel) => {
    const label = sel || "link";
    const text = `[${label}](https://)`;
    return sel ? { text, select: [label.length + 3, text.length - 1] } : { text, select: [1, 1 + label.length] };
  });
}

export function insertImage(view: EditorView) {
  return wrapWith(view, (sel) => {
    const alt = sel || "image";
    const text = `![${alt}](assets/image.png)`;
    return { text, select: [alt.length + 4, text.length - 1] };
  });
}

/** Insert a block on its own lines below the cursor's line and select `selectFrom..selectTo` inside it. Returns the block's start. */
function insertBlock(view: EditorView, block: string, select: [number, number]) {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);
  const lead = line.length ? "\n\n" : "";
  const at = line.length ? line.to : line.from;
  view.dispatch({
    changes: { from: at, insert: lead + block },
    selection: EditorSelection.range(at + lead.length + select[0], at + lead.length + select[1]),
    scrollIntoView: true,
    userEvent: "input.format",
  });
  view.focus();
  return at + lead.length;
}

export function insertTable(view: EditorView) {
  const table = "| Column | Column |\n| ------ | ------ |\n| Cell   | Cell   |";
  const start = insertBlock(view, table, [2, 8]);
  // In live preview the table renders as a grid: start typing in its first header cell.
  focusTableCell(view, start);
  return true;
}

export function insertCodeBlock(view: EditorView) {
  insertBlock(view, "```text\n\n```", [8, 8]);
  return true;
}

export function insertQuote(view: EditorView) {
  insertBlock(view, "> Quote", [2, 7]);
  return true;
}

export function insertDivider(view: EditorView) {
  insertBlock(view, "---\n", [4, 4]);
  return true;
}
