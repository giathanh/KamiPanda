import { syntaxTree } from "@codemirror/language";
import type { EditorState, Range } from "@codemirror/state";
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate, WidgetType } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

/*
 * Live preview: markdown renders in place, and the syntax markers of an element
 * (`**`, `#`, `[]()`, fences…) are revealed only while the selection touches it.
 */

const hide = Decoration.replace({});
const markerMark = Decoration.mark({ class: "cm-md-mark" });

const inlineStyles: Record<string, string> = {
  StrongEmphasis: "cm-strong",
  Emphasis: "cm-em",
  InlineCode: "cm-inline-code",
  Strikethrough: "cm-strike",
};

const inlineMarkers: Record<string, string> = {
  StrongEmphasis: "EmphasisMark",
  Emphasis: "EmphasisMark",
  InlineCode: "CodeMark",
  Strikethrough: "StrikethroughMark",
};

class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean) {
    super();
  }
  eq(other: CheckboxWidget) {
    return other.checked === this.checked;
  }
  toDOM(view: EditorView) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = this.checked;
    box.className = "cm-task-box";
    box.setAttribute("aria-label", this.checked ? "Mark as not done" : "Mark as done");
    box.addEventListener("mousedown", (e) => {
      e.preventDefault();
      // `[ ]` / `[x]` — the state character sits right after the bracket.
      const pos = view.posAtDOM(box) + 1;
      view.dispatch({ changes: { from: pos, to: pos + 1, insert: this.checked ? " " : "x" } });
    });
    return box;
  }
  ignoreEvent() {
    return true;
  }
}

class BulletWidget extends WidgetType {
  eq() {
    return true;
  }
  toDOM() {
    const dot = document.createElement("span");
    dot.className = "cm-bullet";
    dot.textContent = "•";
    return dot;
  }
}

class RuleWidget extends WidgetType {
  eq() {
    return true;
  }
  toDOM() {
    const hr = document.createElement("span");
    hr.className = "cm-hr";
    return hr;
  }
}

class ImageWidget extends WidgetType {
  constructor(readonly src: string, readonly alt: string) {
    super();
  }
  eq(other: ImageWidget) {
    return other.src === this.src && other.alt === this.alt;
  }
  toDOM() {
    const wrap = document.createElement("span");
    wrap.className = "cm-image";
    const img = document.createElement("img");
    img.src = this.src;
    img.alt = this.alt;
    img.onerror = () => {
      wrap.classList.add("cm-image-missing");
      wrap.textContent = this.alt || this.src;
    };
    wrap.appendChild(img);
    return wrap;
  }
}

const copyIcon =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
const checkIcon =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>';

class CodeHeaderWidget extends WidgetType {
  constructor(readonly lang: string, readonly code: string) {
    super();
  }
  eq(other: CodeHeaderWidget) {
    return other.lang === this.lang && other.code === this.code;
  }
  toDOM() {
    const header = document.createElement("span");
    header.className = "cm-code-header";
    const label = document.createElement("span");
    label.className = "cm-code-lang";
    label.textContent = this.lang;
    const copy = document.createElement("button");
    copy.className = "cm-code-copy";
    copy.setAttribute("aria-label", "Copy code");
    copy.innerHTML = copyIcon;
    copy.addEventListener("mousedown", (e) => e.preventDefault());
    copy.addEventListener("click", () => {
      navigator.clipboard?.writeText(this.code).then(() => {
        copy.innerHTML = checkIcon;
        setTimeout(() => (copy.innerHTML = copyIcon), 1200);
      });
    });
    header.append(label, copy);
    return header;
  }
  ignoreEvent() {
    return true;
  }
}

function selectionTouches(state: EditorState, from: number, to: number) {
  return state.selection.ranges.some((r) => r.from <= to && r.to >= from);
}

function child(node: SyntaxNode, name: string) {
  return node.getChild(name);
}

function buildDecorations(view: EditorView): DecorationSet {
  const { state } = view;
  const doc = state.doc;
  const focused = view.hasFocus;
  const touches = (from: number, to: number) => focused && selectionTouches(state, from, to);
  const lineActive = (pos: number) => {
    const line = doc.lineAt(pos);
    return touches(line.from, line.to);
  };

  const decos: Range<Decoration>[] = [];
  const codeLines = new Set<number>();

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (ref) => {
        const node = ref.node;
        const name = node.name;

        const heading = /^ATXHeading(\d)$/.exec(name);
        if (heading) {
          const line = doc.lineAt(node.from);
          decos.push(Decoration.line({ class: `cm-h cm-h${heading[1]}` }).range(line.from));
          const mark = child(node, "HeaderMark");
          if (mark && mark.from === line.from) {
            if (lineActive(node.from)) {
              decos.push(markerMark.range(mark.from, mark.to));
            } else {
              const end = doc.sliceString(mark.to, mark.to + 1) === " " ? mark.to + 1 : mark.to;
              decos.push(hide.range(mark.from, end));
            }
          }
          return;
        }

        if (name in inlineStyles) {
          const active = touches(node.from, node.to);
          const marks = node.getChildren(inlineMarkers[name]);
          if (marks.length >= 2) {
            const inner = { from: marks[0].to, to: marks[marks.length - 1].from };
            if (inner.to > inner.from) decos.push(Decoration.mark({ class: inlineStyles[name] }).range(inner.from, inner.to));
          }
          for (const m of marks) decos.push((active ? markerMark : hide).range(m.from, m.to));
          return name === "InlineCode" ? false : undefined;
        }

        if (name === "Link") {
          const marks = node.getChildren("LinkMark");
          if (marks.length < 2) return;
          const textFrom = marks[0].to;
          const textTo = marks[1].from;
          if (textTo > textFrom) decos.push(Decoration.mark({ class: "cm-link" }).range(textFrom, textTo));
          if (touches(node.from, node.to)) {
            decos.push(markerMark.range(node.from, textFrom));
            decos.push(markerMark.range(textTo, node.to));
          } else {
            decos.push(hide.range(node.from, textFrom));
            decos.push(hide.range(textTo, node.to));
          }
          return false;
        }

        if (name === "Image") {
          if (touches(node.from, node.to)) {
            decos.push(markerMark.range(node.from, node.to));
          } else {
            const marks = node.getChildren("LinkMark");
            const url = child(node, "URL");
            const alt = marks.length >= 2 ? doc.sliceString(marks[0].to, marks[1].from) : "";
            decos.push(
              Decoration.replace({ widget: new ImageWidget(url ? doc.sliceString(url.from, url.to) : "", alt) }).range(node.from, node.to),
            );
          }
          return false;
        }

        if (name === "FencedCode") {
          const first = doc.lineAt(node.from);
          const last = doc.lineAt(node.to);
          const active = touches(node.from, node.to);
          for (let n = first.number; n <= last.number; n++) {
            const line = doc.line(n);
            codeLines.add(n);
            let cls = "cm-codeblock";
            if (n === first.number) cls += " cm-codeblock-first";
            if (n === last.number) cls += " cm-codeblock-last";
            decos.push(Decoration.line({ class: cls }).range(line.from));
          }
          const marks = node.getChildren("CodeMark");
          const info = child(node, "CodeInfo");
          const text = child(node, "CodeText");
          const closed = marks.length >= 2 && last.number > first.number;
          if (active) {
            decos.push(markerMark.range(first.from, first.to));
            if (closed) decos.push(markerMark.range(last.from, last.to));
          } else {
            const lang = info ? doc.sliceString(info.from, info.to) : "text";
            const code = text ? doc.sliceString(text.from, text.to) : "";
            decos.push(Decoration.replace({ widget: new CodeHeaderWidget(lang, code) }).range(first.from, first.to));
            if (closed && last.to > last.from) {
              decos.push(hide.range(last.from, last.to));
              decos.push(Decoration.line({ class: "cm-codeblock-fence-hidden" }).range(last.from));
            }
          }
          return false;
        }

        if (name === "Blockquote") {
          const first = doc.lineAt(node.from).number;
          const last = doc.lineAt(node.to).number;
          for (let n = first; n <= last; n++) decos.push(Decoration.line({ class: "cm-quote" }).range(doc.line(n).from));
          return;
        }

        if (name === "QuoteMark") {
          if (lineActive(node.from)) {
            decos.push(markerMark.range(node.from, node.to));
          } else {
            const end = doc.sliceString(node.to, node.to + 1) === " " ? node.to + 1 : node.to;
            decos.push(hide.range(node.from, end));
          }
          return;
        }

        if (name === "ListMark") {
          const item = node.parent;
          const task = item?.getChild("Task");
          const bullet = item?.parent?.name === "BulletList";
          if (lineActive(node.from)) {
            decos.push(markerMark.range(node.from, node.to));
          } else if (task) {
            // A checkbox stands in for the bullet.
            decos.push(hide.range(node.from, Math.min(node.to + 1, task.from)));
          } else if (bullet) {
            decos.push(Decoration.replace({ widget: new BulletWidget() }).range(node.from, node.to));
          } else {
            decos.push(Decoration.mark({ class: "cm-ordinal" }).range(node.from, node.to));
          }
          return;
        }

        if (name === "Task") {
          const marker = child(node, "TaskMarker");
          if (!marker) return;
          const checked = /x/i.test(doc.sliceString(marker.from, marker.to));
          decos.push(Decoration.line({ class: checked ? "cm-task cm-task-done" : "cm-task" }).range(doc.lineAt(node.from).from));
          if (touches(marker.from, marker.to)) {
            decos.push(markerMark.range(marker.from, marker.to));
          } else {
            decos.push(Decoration.replace({ widget: new CheckboxWidget(checked) }).range(marker.from, marker.to));
          }
          return;
        }

        if (name === "HorizontalRule") {
          if (lineActive(node.from)) decos.push(markerMark.range(node.from, node.to));
          else decos.push(Decoration.replace({ widget: new RuleWidget() }).range(node.from, node.to));
          return false;
        }
      },
    });

    // Blank separator lines collapse to paragraph spacing unless the cursor is on them.
    for (let pos = from; pos <= to; ) {
      const line = doc.lineAt(pos);
      if (line.length === 0 && !codeLines.has(line.number) && !lineActive(line.from)) {
        decos.push(Decoration.line({ class: "cm-blank" }).range(line.from));
      }
      pos = line.to + 1;
    }
  }

  return Decoration.set(decos, true);
}

export const livePreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.selectionSet || u.viewportChanged || u.focusChanged || syntaxTree(u.startState) !== syntaxTree(u.state)) {
        this.decorations = buildDecorations(u.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

export const livePreviewAttrs = EditorView.editorAttributes.of({ class: "cm-live" });
