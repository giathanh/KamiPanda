import { isolateHistory, redo, undo } from "@codemirror/commands";
import { syntaxTree } from "@codemirror/language";
import { type EditorState, type Range, StateField } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import { renderInlineMarkdown as renderInline } from "./markdown";
import { t } from "../i18n";

/*
 * Live-preview tables: a GFM table renders as an editable grid. Every edit is
 * written straight back to the markdown source, so undo, save and Source mode
 * all see the same text.
 */

type Align = "left" | "center" | "right" | null;

interface TableData {
  aligns: Align[];
  /** rows[0] is the header row. */
  rows: string[][];
}

// ---- Markdown <-> model ---------------------------------------------------

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|"));
}

function parseAlign(cell: string): Align {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  return left && right ? "center" : right ? "right" : left ? "left" : null;
}

function parseTable(source: string): TableData | null {
  const lines = source.split("\n");
  if (lines.length < 2) return null;
  const header = splitRow(lines[0]);
  const aligns = splitRow(lines[1]).map(parseAlign);
  const body = lines.slice(2).map(splitRow);
  const cols = Math.max(header.length, ...body.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array(cols - r.length).fill("")];
  return {
    aligns: Array.from({ length: cols }, (_, i) => aligns[i] ?? null),
    rows: [pad(header), ...body.map(pad)],
  };
}

function serializeTable({ aligns, rows }: TableData): string {
  const esc = rows.map((r) => r.map((c) => c.replace(/\n/g, " ").trim().replace(/\|/g, "\\|")));
  const widths = aligns.map((_, i) => Math.max(3, ...esc.map((r) => r[i].length)));
  const line = (cells: string[]) => "| " + cells.map((c, i) => c.padEnd(widths[i])).join(" | ") + " |";
  const delim = aligns.map((a, i) => {
    const w = widths[i];
    if (a === "center") return ":" + "-".repeat(w - 2) + ":";
    if (a === "right") return "-".repeat(w - 1) + ":";
    if (a === "left") return ":" + "-".repeat(w - 1);
    return "-".repeat(w);
  });
  return [line(esc[0]), line(delim), ...esc.slice(1).map(line)].join("\n");
}

// ---- Widget ---------------------------------------------------------------

/** [row, col, select the cell's text instead of placing the caret at its end] */
type CellFocus = [number, number, boolean?];

interface TableDOM extends HTMLElement {
  widget: TableWidget;
  /** Cell to focus after the next render. */
  pendingFocus?: CellFocus;
}

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function focusCell(cell: HTMLElement, select = false) {
  cell.focus();
  if (select) window.getSelection()?.selectAllChildren(cell);
  else placeCaretAtEnd(cell);
}

const plainTextOnly = (() => {
  const el = document.createElement("div");
  el.contentEditable = "plaintext-only";
  return el.contentEditable === "plaintext-only";
})();

class TableWidget extends WidgetType {
  constructor(readonly source: string, readonly data: TableData) {
    super();
  }

  eq(other: TableWidget) {
    return other.source === this.source;
  }

  toDOM(view: EditorView) {
    const dom = document.createElement("div") as unknown as TableDOM;
    dom.className = "cm-table-wrap";
    dom.widget = this;
    this.render(dom, view);
    return dom;
  }

  updateDOM(dom: HTMLElement, view: EditorView) {
    const t = dom as TableDOM;
    t.widget = this;
    this.render(t, view);
    return true;
  }

  ignoreEvent() {
    return true;
  }

  get estimatedHeight() {
    return this.data.rows.length * 38 + 30;
  }

  /** Rebuild the grid, or patch it in place when the shape is unchanged so the focused cell keeps its caret. */
  private render(dom: TableDOM, view: EditorView) {
    const { rows, aligns } = this.data;
    const table = dom.querySelector("table");
    const sameShape =
      table && table.rows.length === rows.length && Array.from(table.rows).every((tr) => tr.cells.length === aligns.length);

    if (sameShape && !dom.pendingFocus) {
      Array.from(table.rows).forEach((tr, r) =>
        Array.from(tr.cells).forEach((td, c) => {
          const cell = td.firstElementChild as HTMLElement;
          const value = rows[r][c];
          td.style.textAlign = aligns[c] ?? "";
          if (cell.dataset.value === value) return;
          cell.dataset.value = value;
          if (document.activeElement === cell) {
            // Typing already produced this text (modulo surrounding spaces); only external changes (undo) rewrite it.
            if (cell.textContent!.trim() !== value) {
              cell.textContent = value;
              placeCaretAtEnd(cell);
            }
          } else {
            cell.innerHTML = renderInline(value);
          }
        }),
      );
      return;
    }

    let focus = dom.pendingFocus;
    dom.pendingFocus = undefined;
    const active = document.activeElement as HTMLElement | null;
    if (!focus && active?.dataset.row && dom.contains(active)) focus = [+active.dataset.row, +active.dataset.col!];

    dom.textContent = "";
    const newTable = document.createElement("table");
    newTable.className = "cm-table";
    let toFocus: HTMLElement | null = null;
    const scroll = document.createElement("div");
    scroll.className = "cm-table-scroll";

    rows.forEach((row, r) => {
      const tr = document.createElement("tr");
      row.forEach((value, c) => {
        const td = document.createElement(r === 0 ? "th" : "td");
        td.style.textAlign = aligns[c] ?? "";
        const cell = document.createElement("div");
        cell.className = "cm-table-cell";
        cell.contentEditable = plainTextOnly ? "plaintext-only" : "true";
        cell.spellcheck = false;
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        cell.dataset.value = value;
        cell.innerHTML = renderInline(value);
        this.bindCell(dom, view, cell);
        td.appendChild(cell);
        tr.appendChild(td);
        if (focus && focus[0] === r && focus[1] === c) toFocus = cell;
      });
      newTable.appendChild(tr);
    });

    const addCol = document.createElement("button");
    addCol.className = "cm-table-add cm-table-add-col";
    addCol.title = t("widget.addColumn");
    addCol.setAttribute("aria-label", addCol.title);
    addCol.textContent = "+";
    addCol.addEventListener("mousedown", (e) => e.preventDefault());
    addCol.addEventListener("click", () => addColumn(dom, view));

    const addRowBtn = document.createElement("button");
    addRowBtn.className = "cm-table-add cm-table-add-row";
    addRowBtn.title = t("widget.addRow");
    addRowBtn.setAttribute("aria-label", addRowBtn.title);
    addRowBtn.textContent = "+";
    addRowBtn.addEventListener("mousedown", (e) => e.preventDefault());
    addRowBtn.addEventListener("click", () => addRow(dom, view));

    scroll.appendChild(newTable);
    dom.append(scroll, addCol, addRowBtn);
    if (toFocus) focusCell(toFocus, focus![2]);
  }

  private bindCell(dom: TableDOM, view: EditorView, cell: HTMLElement) {
    const pos = () => [+cell.dataset.row!, +cell.dataset.col!] as [number, number];

    cell.addEventListener("focus", () => {
      // Edit the raw markdown; the rendered form comes back on blur.
      cell.textContent = cell.dataset.value!;
      placeCaretAtEnd(cell);
    });
    cell.addEventListener("blur", () => {
      cell.innerHTML = renderInline(cell.dataset.value!);
    });
    cell.addEventListener("input", () => {
      const [r, c] = pos();
      const value = cell.textContent!.replace(/\n/g, " ").trim();
      cell.dataset.value = value;
      commit(dom, view, (d) => (d.rows[r][c] = value), undefined, cellTypingEvent);
    });
    if (!plainTextOnly) {
      cell.addEventListener("paste", (e) => {
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData?.getData("text/plain").replace(/\n/g, " ") ?? "");
      });
    }
    cell.addEventListener("keydown", (e) => {
      const [r, c] = pos();
      const { rows, aligns } = dom.widget.data;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") {
        // Route undo/redo through the editor history, which holds every cell edit.
        e.preventDefault();
        (e.shiftKey ? redo : undo)(view);
      } else if (e.key === "Tab") {
        e.preventDefault();
        const i = r * aligns.length + c + (e.shiftKey ? -1 : 1);
        if (i < 0) return;
        if (i >= rows.length * aligns.length) addRow(dom, view, 0);
        else moveTo(dom, Math.floor(i / aligns.length), i % aligns.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (r === rows.length - 1) addRow(dom, view, c);
        else moveTo(dom, r + 1, c);
      } else if (e.key === "Escape") {
        e.preventDefault();
        leaveTable(dom, view);
      }
    });
  }
}

function tableRange(dom: TableDOM, view: EditorView) {
  const from = view.posAtDOM(dom);
  const to = from + dom.widget.source.length;
  return view.state.doc.sliceString(from, to) === dom.widget.source ? { from, to } : null;
}

/** User event for typing inside a cell; the editor's history joins these into one undo step. */
export const cellTypingEvent = "input.type.table";

function commit(dom: TableDOM, view: EditorView, edit: (d: TableData) => void, focus?: CellFocus, userEvent = "input.table") {
  const range = tableRange(dom, view);
  if (!range) return;
  const data: TableData = { aligns: [...dom.widget.data.aligns], rows: dom.widget.data.rows.map((r) => [...r]) };
  edit(data);
  const insert = serializeTable(data);
  if (insert === dom.widget.source) {
    if (focus) moveTo(dom, ...focus);
    return;
  }
  dom.pendingFocus = focus;
  // Send only the changed span, so unpadded edits stay small.
  const old = dom.widget.source;
  let start = 0;
  while (start < old.length && start < insert.length && old[start] === insert[start]) start++;
  let end = 0;
  while (end < old.length - start && end < insert.length - start && old[old.length - 1 - end] === insert[insert.length - 1 - end]) end++;
  view.dispatch({
    changes: { from: range.from + start, to: range.to - end, insert: insert.slice(start, insert.length - end) },
    userEvent,
    // Adding a row or column is its own undo step, never merged with typing around it.
    annotations: userEvent === cellTypingEvent ? [] : isolateHistory.of("full"),
  });
}

function moveTo(dom: TableDOM, r: number, c: number, select = false) {
  const cell = dom.querySelector<HTMLElement>(`.cm-table-cell[data-row="${r}"][data-col="${c}"]`);
  if (cell) focusCell(cell, select);
}

function addRow(dom: TableDOM, view: EditorView, focusCol = 0) {
  const n = dom.widget.data.rows.length;
  commit(dom, view, (d) => d.rows.push(d.aligns.map(() => "")), [n, focusCol]);
}

function addColumn(dom: TableDOM, view: EditorView) {
  const n = dom.widget.data.aligns.length;
  commit(
    dom,
    view,
    (d) => {
      d.aligns.push(null);
      d.rows.forEach((r, i) => r.push(i === 0 ? "Column" : ""));
    },
    [0, n, true],
  );
}

function leaveTable(dom: TableDOM, view: EditorView) {
  const range = tableRange(dom, view);
  view.focus();
  if (range) view.dispatch({ selection: { anchor: range.to }, scrollIntoView: true });
}

/** Focus a cell of the table widget that starts at `pos`, if one is rendered. Returns whether it did. */
export function focusTableCell(view: EditorView, pos: number, row = 0, col = 0, select = true) {
  for (const el of view.contentDOM.querySelectorAll<HTMLElement>(".cm-table-wrap")) {
    if (view.posAtDOM(el) !== pos) continue;
    moveTo(el as TableDOM, row, col, select);
    return true;
  }
  return false;
}

// ---- Decorations ----------------------------------------------------------

function buildTables(state: EditorState): DecorationSet {
  const decos: Range<Decoration>[] = [];
  const doc = state.doc;
  syntaxTree(state).iterate({
    enter: (node) => {
      if (node.name === "Document") return;
      // Only top-level tables: ones nested in lists or quotes carry prefixes on every line.
      if (node.name !== "Table") return false;
      const from = doc.lineAt(node.from).from;
      const to = doc.lineAt(node.to).to;
      if (from !== node.from) return false;
      const source = doc.sliceString(from, to);
      const data = parseTable(source);
      if (data) decos.push(Decoration.replace({ widget: new TableWidget(source, data), block: true }).range(from, to));
      return false;
    },
  });
  return Decoration.set(decos);
}

// Block widgets that span line breaks must come from a state field, not a view plugin.
export const tablePreview = StateField.define<DecorationSet>({
  create: buildTables,
  update(value, tr) {
    if (tr.docChanged || syntaxTree(tr.startState) !== syntaxTree(tr.state)) return buildTables(tr.state);
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});
