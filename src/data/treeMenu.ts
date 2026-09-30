import { Menu, type MenuItemOptions, type PredefinedMenuItemOptions } from "@tauri-apps/api/menu";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import {
  createFile,
  createFolder,
  error,
  refresh,
  renamingId,
  rootPath,
  selectFile,
  trashNode,
  type Folder,
  type TreeNode,
} from "./workspace";

const revealLabel = /Mac/.test(navigator.userAgent) ? "Reveal in Finder" : "Show in File Explorer";
const separator: PredefinedMenuItemOptions = { item: "Separator" };

function reveal(path: string) {
  revealItemInDir(path).catch((e) => (error.value = `Could not reveal ${path}: ${e}`));
}

function copyPath(path: string) {
  navigator.clipboard.writeText(path).catch((e) => (error.value = `Could not copy the path: ${e}`));
}

/**
 * Shows the native context menu for a tree node, or for the empty tree area when `node` is omitted.
 * `parent` is the folder containing `node`, where new items next to a note are created.
 */
export async function showTreeMenu(node?: TreeNode, parent?: Folder) {
  let items: (MenuItemOptions | PredefinedMenuItemOptions)[];
  if (!node) {
    const root = rootPath.value;
    if (!root) return;
    items = [
      { text: "New note", action: () => createFile(null) },
      { text: "New folder", action: () => createFolder(null) },
      separator,
      { text: revealLabel, action: () => reveal(root) },
      { text: "Reload folder", action: () => refresh() },
    ];
  } else {
    // New items go inside a folder, or next to a note.
    const target = node.kind === "folder" ? node : (parent ?? null);
    items = [
      ...(node.kind === "file" ? [{ text: "Open", action: () => selectFile(node) }, separator] : []),
      { text: "New note", action: () => createFile(target) },
      { text: "New folder", action: () => createFolder(target) },
      separator,
      { text: "Rename…", action: () => (renamingId.value = node.id) },
      { text: revealLabel, action: () => reveal(node.id) },
      { text: "Copy path", action: () => copyPath(node.id) },
      separator,
      { text: "Move to Trash", action: () => trashNode(node) },
    ];
  }
  const menu = await Menu.new({ items });
  await menu.popup();
}
