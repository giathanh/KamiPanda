import { getVersion } from "@tauri-apps/api/app";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { ref } from "vue";
import { hasUnsaved } from "./workspace";

export type UpdateStatus = "idle" | "checking" | "downloading" | "error";

export const appVersion = ref("");
export const updateStatus = ref<UpdateStatus>("idle");
/** Download progress in percent, or null when the size is unknown. */
export const updateProgress = ref<number | null>(null);
export const lastResult = ref<string | null>(null);

getVersion().then((v) => (appVersion.value = v));

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
      lastResult.value = "You're on the latest version.";
      if (!silent) await message(`KamiPanda ${appVersion.value} is the latest version.`, { title: "No updates" });
      return;
    }

    updateStatus.value = "idle";
    const notes = update.body?.trim() ? `\n\n${update.body.trim()}` : "";
    const install = await ask(`KamiPanda ${update.version} is available (you have ${update.currentVersion}).${notes}`, {
      title: "Update available",
      okLabel: "Install and restart",
      cancelLabel: "Later",
    });
    if (!install) {
      lastResult.value = `Version ${update.version} is available.`;
      return;
    }
    if (hasUnsaved.value) {
      const discard = await ask("You have unsaved changes. Restart to update and discard them?", {
        title: "Unsaved changes",
        kind: "warning",
        okLabel: "Discard",
      });
      if (!discard) {
        lastResult.value = `Version ${update.version} is available.`;
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
    lastResult.value = `Could not check for updates: ${e}`;
    if (!silent) await message(String(e), { title: "Update failed", kind: "error" });
  } finally {
    updateProgress.value = null;
  }
}
