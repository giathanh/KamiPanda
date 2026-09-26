import { computed, reactive, ref } from "vue";

export interface DocFile {
  kind: "file";
  id: string;
  name: string;
  content: string;
  savedContent: string;
}

export interface Folder {
  kind: "folder";
  id: string;
  name: string;
  open: boolean;
  /** Folders like `assets` hold attachments rather than notes. */
  assets?: boolean;
  children: TreeNode[];
}

export type TreeNode = DocFile | Folder;

const WELCOME = `# Welcome to Marka

Markdown that renders as you type. Syntax stays out of the way until your cursor needs it.

## The basics

Wrap a phrase in **double asterisks** to make it bold. The markers show only while the cursor is inside.

- [x] Headings, lists and tables render inline
- [x] Pasted images are copied into ./assets
- [ ] Choose a theme in Settings → Appearance

## Code blocks

\`\`\`bash
npm run build
npm run package -- --mac --win
\`\`\`

> Tip: switch to *Source* mode to see every marker, or *Split* to compare with the rendered output.
`;

const ROADMAP = `# Q4 roadmap

## Themes

1. Faster startup on large workspaces
2. Sync conflicts you can actually read
3. Export to PDF and \`.docx\`

## Open questions

- [ ] Do we ship plugins in Q4 or Q1?
- [ ] Who owns the [design system](https://m3.material.io)?

---

*Last reviewed by the product team.*
`;

const CHECKLIST = `# Release checklist

- [ ] Bump version in \`package.json\` and \`tauri.conf.json\`
- [ ] Run \`npm run tauri build\` on macOS and Windows
- [ ] Smoke-test **live editing**, *split view* and export
- [ ] Write the changelog
`;

function file(id: string, name: string, content: string): DocFile {
  return { kind: "file", id, name, content, savedContent: content };
}

export const tree = reactive<TreeNode[]>([
  {
    kind: "folder",
    id: "product",
    name: "Product",
    open: true,
    children: [
      file("welcome", "Welcome.md", WELCOME),
      // Starts with unsaved edits so the dirty indicator is visible, as in the design.
      { ...file("roadmap", "Q4 roadmap.md", ROADMAP), savedContent: "" },
      file("checklist", "Release checklist.md", CHECKLIST),
      { kind: "folder", id: "assets", name: "assets", open: false, assets: true, children: [] },
    ],
  },
  { kind: "folder", id: "journal", name: "Journal", open: false, children: [file("journal-1", "2026-09-25.md", "# Thursday\n\n")] },
  { kind: "folder", id: "research", name: "Research", open: false, children: [] },
  { kind: "folder", id: "archive", name: "Archive", open: false, children: [] },
]);

function findFile(nodes: TreeNode[], id: string): DocFile | undefined {
  for (const node of nodes) {
    if (node.kind === "file" && node.id === id) return node;
    if (node.kind === "folder") {
      const hit = findFile(node.children, id);
      if (hit) return hit;
    }
  }
}

function findParent(nodes: TreeNode[], id: string, parent?: Folder): Folder | undefined {
  for (const node of nodes) {
    if (node.id === id) return parent;
    if (node.kind === "folder") {
      const hit = findParent(node.children, id, node);
      if (hit) return hit;
    }
  }
}

export const activeId = ref("welcome");
export const activeFile = computed(() => findFile(tree, activeId.value)!);
export const activeFolder = computed(() => findParent(tree, activeId.value));

export function isDirty(f: DocFile) {
  return f.content !== f.savedContent;
}

export function saveActive() {
  activeFile.value.savedContent = activeFile.value.content;
}

let untitled = 0;
export function createFile(folder?: Folder) {
  const target = folder ?? activeFolder.value;
  const siblings = target ? target.children : tree;
  const name = untitled++ === 0 ? "Untitled.md" : `Untitled ${untitled}.md`;
  const f = file(`new-${Date.now()}`, name, "# ");
  f.savedContent = "";
  siblings.push(f);
  if (target) target.open = true;
  activeId.value = f.id;
}
