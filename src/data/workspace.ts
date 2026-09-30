import { invoke } from "@tauri-apps/api/core";
import { ask, open } from "@tauri-apps/plugin-dialog";
import { computed, reactive, ref, watch } from "vue";
import { settings } from "./settings";

export interface DocFile {
  kind: "file";
  /** Absolute path on disk; doubles as the id. */
  id: string;
  name: string;
  content: string;
  savedContent: string;
  /** Content is read from disk the first time the file is opened. */
  loaded: boolean;
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

type Entry =
  | { kind: "file"; name: string; path: string }
  | { kind: "folder"; name: string; path: string; children: Entry[] };

const STORAGE_KEY = "kamipanda.workspace";

export const rootPath = ref<string | null>(null);
export const rootName = computed(() => rootPath.value?.split(/[\\/]/).filter(Boolean).pop() ?? "");
export const tree = reactive<TreeNode[]>([]);
export const activeId = ref<string | null>(null);
export const error = ref<string | null>(null);

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

function allFiles(nodes: TreeNode[]): DocFile[] {
  return nodes.flatMap((n) => (n.kind === "file" ? [n] : allFiles(n.children)));
}

function allFolders(nodes: TreeNode[]): Folder[] {
  return nodes.flatMap((n) => (n.kind === "folder" ? [n, ...allFolders(n.children)] : []));
}

export const activeFile = computed(() => (activeId.value ? findFile(tree, activeId.value) : undefined));
export const activeFolder = computed(() => (activeId.value ? findParent(tree, activeId.value) : undefined));

export function isDirty(f: DocFile) {
  return f.content !== f.savedContent;
}

export const hasUnsaved = computed(() => allFiles(tree).some(isDirty));

/** Builds tree nodes from disk, keeping loaded content and open state of nodes that still exist. */
function toNodes(entries: Entry[], prev: Map<string, TreeNode>): TreeNode[] {
  return entries.map((e) => {
    const old = prev.get(e.path);
    if (e.kind === "file") {
      if (old?.kind === "file") return { ...old, name: e.name };
      return { kind: "file", id: e.path, name: e.name, content: "", savedContent: "", loaded: false };
    }
    const assets = e.name.toLowerCase() === "assets";
    return {
      kind: "folder",
      id: e.path,
      name: e.name,
      open: old?.kind === "folder" ? old.open : false,
      assets,
      children: toNodes(e.children, prev),
    };
  });
}

export async function refresh() {
  if (!rootPath.value) return;
  const entries = await invoke<Entry[]>("read_workspace", { root: rootPath.value });
  const prev = new Map<string, TreeNode>([...allFiles(tree), ...allFolders(tree)].map((n) => [n.id, n]));
  tree.splice(0, tree.length, ...toNodes(entries, prev));
  if (activeId.value && !findFile(tree, activeId.value)) activeId.value = null;
}

async function load(path: string) {
  const entries = await invoke<Entry[]>("read_workspace", { root: path });
  rootPath.value = path;
  activeId.value = null;
  tree.splice(0, tree.length, ...toNodes(entries, new Map()));
  localStorage.setItem(STORAGE_KEY, path);
  error.value = null;
}

export async function openWorkspace() {
  await flushAutoSave();
  if (hasUnsaved.value) {
    const discard = await ask("You have unsaved changes. Open another folder and discard them?", {
      title: "Unsaved changes",
      kind: "warning",
      okLabel: "Discard",
    });
    if (!discard) return;
  }
  const picked = await open({ directory: true, multiple: false, title: "Open folder" });
  if (typeof picked !== "string") return;
  try {
    await load(picked);
  } catch (e) {
    error.value = `Could not open ${picked}: ${e}`;
  }
}

export async function selectFile(f: DocFile) {
  if (!f.loaded) {
    try {
      const text = await invoke<string>("read_text", { path: f.id });
      f.content = f.savedContent = text;
      f.loaded = true;
    } catch (e) {
      error.value = `Could not read ${f.name}: ${e}`;
      return;
    }
  }
  activeId.value = f.id;
}

/** Writes are chained so an older save can never land on disk after a newer one. */
let saving = Promise.resolve();

export function saveFile(f: DocFile) {
  saving = saving.then(async () => {
    if (!isDirty(f)) return;
    const content = f.content;
    try {
      await invoke("write_text", { path: f.id, content });
      f.savedContent = content;
    } catch (e) {
      error.value = `Could not save ${f.name}: ${e}`;
    }
  });
  return saving;
}

export function saveActive() {
  cancelAutoSave();
  const f = activeFile.value;
  return f ? saveFile(f) : Promise.resolve();
}

const AUTO_SAVE_DELAY = 1000;
let pending: DocFile | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;

function cancelAutoSave() {
  clearTimeout(timer);
  pending = undefined;
}

/** Saves the file waiting on the auto-save timer right away, if any. */
export function flushAutoSave() {
  const f = pending;
  cancelAutoSave();
  return f ? saveFile(f) : saving;
}

function scheduleAutoSave() {
  const f = activeFile.value;
  if (!settings.autoSave || !f || !isDirty(f)) return;
  if (pending && pending !== f) flushAutoSave();
  pending = f;
  clearTimeout(timer);
  timer = setTimeout(flushAutoSave, AUTO_SAVE_DELAY);
}

watch(() => activeFile.value?.content, scheduleAutoSave);
// Don't leave edits behind when switching notes or apps.
watch(activeId, () => flushAutoSave());
window.addEventListener("blur", () => flushAutoSave());
watch(
  () => settings.autoSave,
  (on) => (on ? scheduleAutoSave() : cancelAutoSave()),
);

/** Id of the file whose name is being edited in the tree. */
export const renamingId = ref<string | null>(null);

export async function renameFile(f: DocFile, newName: string) {
  let name = newName.trim();
  if (!name || name === f.name) return;
  // Keep it a Markdown file, otherwise it would drop out of the tree.
  if (!/\.(md|markdown)$/i.test(name)) name += ".md";
  try {
    const path = await invoke<string>("rename_path", { path: f.id, newName: name });
    const wasActive = activeId.value === f.id;
    f.id = path;
    f.name = name;
    if (wasActive) activeId.value = path;
    error.value = null;
  } catch (e) {
    error.value = `Could not rename ${f.name}: ${e}`;
  }
}

export async function createFile(folder?: Folder) {
  const dir = folder?.id ?? activeFolder.value?.id ?? rootPath.value;
  if (!dir) return;
  try {
    const path = await invoke<string>("create_note", { dir, content: "# " });
    await refresh();
    const parent = findParent(tree, path);
    if (parent) parent.open = true;
    const f = findFile(tree, path);
    if (f) {
      await selectFile(f);
      renamingId.value = f.id;
    }
  } catch (e) {
    error.value = `Could not create a note: ${e}`;
  }
}

const last = localStorage.getItem(STORAGE_KEY);
if (last) load(last).catch(() => localStorage.removeItem(STORAGE_KEY));
