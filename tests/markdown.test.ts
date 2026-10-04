import { describe, expect, it } from "vitest";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { GFM } from "@lezer/markdown";
import { renderMarkdown, renderInlineMarkdown } from "../src/editor/markdown";
import { tablePreview } from "../src/editor/table";

const payloads = [
  '<img src=x onerror="window.__TAURI_INTERNALS__.invoke(\'write_text\')">',
  '<a href="jAvAsCrIpT:alert(1)">click</a>',
  '<a href="&#106;avascript:alert(1)">click</a>',
  '<svg onload="alert(1)"><a href="javascript:alert(1)">x</a></svg>',
  '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
  '<math><mtext><img src=x onerror=alert(1)></mtext></math>',
];
function safe(html: string) {
  const root = document.createElement("div");
  root.innerHTML = html;
  expect(root.querySelector("script,iframe,svg,math,style,form")).toBeNull();
  for (const element of root.querySelectorAll("*")) {
    for (const attr of element.attributes) {
      expect(attr.name).not.toMatch(/^on/i);
      if (["href", "src"].includes(attr.name)) expect(attr.value).not.toMatch(/^javascript:/i);
    }
  }
}
describe("Markdown DOM boundary", () => {
  for (const render of [renderMarkdown, renderInlineMarkdown]) {
    it.each(payloads)("removes active content: %s", (payload) => safe(render(payload)));
    it("preserves ordinary inline Markdown and benign HTML", () => {
      const html = render('**bold** *em* `code` [link](https://example.com) ![image](photo.png) <sup>2</sup>');
      for (const tag of ["strong", "em", "code", "a", "img", "sup"]) expect(html).toContain(`<${tag}`);
    });
  }
  it("preserves headings, tables, task checkboxes, and fenced code", () => {
    const html = renderMarkdown('# Title\n\n| a | b |\n| --- | --- |\n| x | y |\n\n- [x] done\n\n```js\nconst x = 1;\n```');
    for (const tag of ["h1", "table", "input", "pre", "code"]) expect(html).toContain(`<${tag}`);
    expect(html).toContain("checked");
    expect(html).toContain("disabled");
  });
  it("sanitizes actual editable table initial render, update and blur", () => {
    const doc = (value: string) => `| Header |\n| --- |\n| ${value} |`;
    const parent = document.createElement("div");
    document.body.append(parent);
    const view = new EditorView({ parent, state: EditorState.create({doc: doc(payloads[0]), extensions: [markdown({extensions: GFM}), tablePreview]}) });
    try {
      expect(parent.querySelectorAll(".cm-table-cell").length).toBe(2);
      safe(parent.innerHTML);
      view.dispatch({ changes: {from: 0, to: view.state.doc.length, insert: doc(payloads[2])} });
      safe(parent.innerHTML);
      const cell = parent.querySelectorAll<HTMLElement>(".cm-table-cell")[1];
      cell.dispatchEvent(new FocusEvent("focus"));
      cell.dispatchEvent(new FocusEvent("blur"));
      safe(parent.innerHTML);
      expect(view.state.doc.toString()).toBe(doc(payloads[2]));
    } finally { view.destroy(); parent.remove(); }
  });
});
