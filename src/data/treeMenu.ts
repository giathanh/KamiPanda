import { Menu, IconMenuItem, MenuItem, PredefinedMenuItem, type MenuItemOptions } from "@tauri-apps/api/menu";
import { Image } from "@tauri-apps/api/image";
import type { Resource } from "@tauri-apps/api/core";
import { iconSvg } from "./icons";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { t } from "../i18n";
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

const revealKey = /Mac/.test(navigator.userAgent) ? "menu.revealMac" : "menu.revealOther";
const separator = "separator" as const;

/** Native objects behind the last menu shown, released when the next one opens. */
let lastMenu: Resource[] = [];

type Item = MenuItemOptions & { icon?: string };

/** Menu icons rendered to bitmaps, kept for the life of the app and keyed by name, color and size. */
const iconCache = new Map<string, Promise<Image | undefined>>();

/**
 * Draws an app icon as a bitmap for a native menu. Native menus follow the system appearance rather
 * than the app theme, so the color comes from `prefers-color-scheme`.
 */
function menuIcon(name: string) {
  const dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const color = dark ? "#e6e6e6" : "#3c3c3c";
  const size = 16 * Math.max(1, Math.round(window.devicePixelRatio || 1));
  const key = `${name}:${color}:${size}`;
  let image = iconCache.get(key);
  if (!image) {
    image = renderIcon(name, color, size).catch(() => undefined);
    iconCache.set(key, image);
  }
  return image;
}

async function renderIcon(name: string, color: string, size: number) {
  const svg = iconSvg(name, size, color);
  if (!svg) return undefined;
  const img = new window.Image(size, size);
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  return Image.new(new Uint8Array(data.buffer), size, size);
}

async function buildItem({ icon, ...item }: Item) {
  const image = icon ? await menuIcon(icon) : undefined;
  return image ? IconMenuItem.new({ ...item, icon: image }) : MenuItem.new(item);
}

function reveal(path: string) {
  revealItemInDir(path).catch((e) => (error.value = t("error.reveal", { name: path, error: String(e) })));
}

function copyPath(path: string) {
  navigator.clipboard.writeText(path).catch((e) => (error.value = t("error.copyPath", { error: String(e) })));
}

/**
 * Shows the native context menu for a tree node, or for the empty tree area when `node` is omitted.
 * `parent` is the folder containing `node`, where new items next to a note are created.
 */
export async function showTreeMenu(node?: TreeNode, parent?: Folder) {
  let items: (Item | typeof separator)[];
  if (!node) {
    const root = rootPath.value;
    if (!root) return;
    items = [
      { text: t("menu.newNote"), icon: "filePlus", action: () => createFile(null) },
      { text: t("menu.newFolder"), icon: "folderPlus", action: () => createFolder(null) },
      separator,
      { text: t(revealKey), icon: "folderOpen", action: () => reveal(root) },
      { text: t("menu.reloadFolder"), icon: "refresh", action: () => refresh() },
    ];
  } else {
    // New items go inside a folder, or next to a note.
    const target = node.kind === "folder" ? node : (parent ?? null);
    items = [
      ...(node.kind === "file" ? [{ text: t("menu.open"), icon: "file", action: () => selectFile(node) }, separator] : []),
      { text: t("menu.newNote"), icon: "filePlus", action: () => createFile(target) },
      { text: t("menu.newFolder"), icon: "folderPlus", action: () => createFolder(target) },
      separator,
      { text: t("menu.rename"), icon: "pen", action: () => (renamingId.value = node.id) },
      { text: t(revealKey), icon: "folderOpen", action: () => reveal(node.id) },
      { text: t("menu.copyPath"), icon: "copy", action: () => copyPath(node.id) },
      separator,
      { text: t("menu.trash"), icon: "trash", action: () => trashNode(node) },
    ];
  }
  // Items passed to `Menu.new` as plain options lose their `action` handler once the menu is
  // built, so each one is created on its own and kept alive until the next menu replaces it.
  const built = await Promise.all(
    items.map((i) => (i === separator ? PredefinedMenuItem.new({ item: "Separator" }) : buildItem(i))),
  );
  const menu = await Menu.new({ items: built });
  for (const r of lastMenu.splice(0, lastMenu.length, menu, ...built)) r.close().catch(() => {});
  await menu.popup();
}
