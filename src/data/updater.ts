import { getVersion } from "@tauri-apps/api/app";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { ref } from "vue";
import { locale, t, type MessageKey } from "../i18n";
import { flushAutoSave, hasUnsaved } from "./workspace";

export type UpdateStatus = "idle" | "checking" | "downloading" | "error";

export const appVersion = ref("");
export const updateStatus = ref<UpdateStatus>("idle");
/** Download progress in percent, or null when the size is unknown. */
export const updateProgress = ref<number | null>(null);
/** Outcome of the last check, kept as a message so it follows language changes. */
export const lastResult = ref<{ key: MessageKey; params?: Record<string, string> } | null>(null);

getVersion().then((v) => (appVersion.value = v));

/**
 * Release notes hold every language, each section starting with a `<!-- lang:xx -->` marker and a
 * heading naming the language. Returns the section for the app language, falling back to English,
 * or the whole text for older notes without markers.
 */
function localizedNotes(body: string) {
  const sections = new Map<string, string>();
  const parts = body.split(/<!-- lang:([\w-]+) -->/);
  for (let i = 1; i < parts.length; i += 2) sections.set(parts[i], parts[i + 1].replace(/^\s*#+ .*\n/, "").trim());
  return sections.get(locale.value) ?? sections.get("en") ?? body.trim();
}

/**
 * Checks GitHub Releases for a newer version and offers to install it.
 * With `silent`, errors and "already up to date" are not reported (used on startup).
 */
export async function checkForUpdates({ silent = false } = {}) {
  if (updateStatus.value === "checking" || updateStatus.value === "downloading") return;
  updateStatus.value = "checking";
  lastResult.value = null;
  try {
    const update = await check();
    if (!update) {
      updateStatus.value = "idle";
      lastResult.value = { key: "update.latestShort" };
      if (!silent) await message(t("update.latest", { version: appVersion.value }), { title: t("update.noUpdates") });
      return;
    }

    updateStatus.value = "idle";
    const notes = update.body?.trim() ? `\n\n${localizedNotes(update.body)}` : "";
    const install = await ask(t("update.available", { version: update.version, current: update.currentVersion }) + notes, {
      title: t("update.availableTitle"),
      okLabel: t("update.install"),
      cancelLabel: t("update.later"),
    });
    if (!install) {
      lastResult.value = { key: "update.availableShort", params: { version: update.version } };
      return;
    }
    await flushAutoSave();
    if (hasUnsaved.value) {
      const discard = await ask(t("update.unsavedRestart"), {
        title: t("dialog.unsavedTitle"),
        kind: "warning",
        okLabel: t("dialog.discard"),
      });
      if (!discard) {
        lastResult.value = { key: "update.availableShort", params: { version: update.version } };
        return;
      }
    }

    updateStatus.value = "downloading";
    let total = 0;
    let received = 0;
    await update.downloadAndInstall((e) => {
      if (e.event === "Started") {
        total = e.data.contentLength ?? 0;
        updateProgress.value = total ? 0 : null;
      } else if (e.event === "Progress" && total) {
        received += e.data.chunkLength;
        updateProgress.value = Math.min(100, Math.round((received / total) * 100));
      }
    });
    await relaunch();
  } catch (e) {
    updateStatus.value = "error";
    lastResult.value = { key: "update.checkFailed", params: { error: String(e) } };
    if (!silent) await message(String(e), { title: t("update.failed"), kind: "error" });
  } finally {
    updateProgress.value = null;
  }
}
