import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { nextTick } from "vue";
import { beforeEach, describe, expect, it } from "vitest";
import { choice, createSettingsStore, custom, defineSettings, number, toggle } from "../src/settings-kit";

const KEY = "test.settings";

const schema = defineSettings({
  theme: choice(["light", "dark", "system"], "system"),
  autoSave: toggle(true),
  zoom: number({ min: 0.5, max: 2, step: 0.1, default: 1 }),
  size: number({ min: 14, max: 28, default: 19 }),
  overrides: custom<Record<string, string>>({}, (raw) => (raw && typeof raw === "object" ? { ...(raw as object) } : undefined)),
});

beforeEach(() => localStorage.clear());

describe("createSettingsStore", () => {
  it("uses defaults when nothing is stored", () => {
    const { settings } = createSettingsStore(schema, { key: KEY });
    expect(settings).toEqual({ theme: "system", autoSave: true, zoom: 1, size: 19, overrides: {} });
  });

  it("falls back per field when stored values are invalid", () => {
    localStorage.setItem(KEY, JSON.stringify({ theme: "sepia", autoSave: "yes", zoom: 1.23, size: 99, overrides: { a: "#fff" } }));
    const { settings } = createSettingsStore(schema, { key: KEY });
    expect(settings).toEqual({ theme: "system", autoSave: true, zoom: 1.2, size: 28, overrides: { a: "#fff" } });
  });

  it("survives corrupt JSON", () => {
    localStorage.setItem(KEY, "{nope");
    expect(createSettingsStore(schema, { key: KEY }).settings.theme).toBe("system");
  });

  it("persists changes", async () => {
    const { settings } = createSettingsStore(schema, { key: KEY });
    settings.theme = "dark";
    await nextTick();
    expect(JSON.parse(localStorage.getItem(KEY)!).theme).toBe("dark");
  });

  it("resets selected keys without sharing default objects", () => {
    const store = createSettingsStore(schema, { key: KEY });
    store.settings.overrides.a = "#000";
    store.settings.size = 20;
    expect(schema.overrides.default).toEqual({});
    expect(store.isDefault(["overrides"])).toBe(false);

    store.reset(["overrides"]);
    expect(store.isDefault(["overrides"])).toBe(true);
    expect(store.settings.size).toBe(20);
    expect(store.isDefault()).toBe(false);
  });
});

describe("number field", () => {
  it("rounds to step without float noise and clamps", () => {
    const zoom = schema.zoom;
    expect(zoom.clamp(1 + 0.1)).toBe(1.1);
    expect(zoom.clamp(0.1 + 0.2)).toBe(0.5);
    expect(zoom.clamp(5)).toBe(2);
  });
});

describe("settings-kit boundary", () => {
  const root = resolve(__dirname, "../src/settings-kit");
  const files = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? files(path) : [path];
    });

  it("imports nothing from the host app", () => {
    for (const file of files(root)) {
      const source = readFileSync(file, "utf8");
      for (const [, spec] of source.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) {
        if (!spec.startsWith(".")) {
          expect(["vue"], `${file} imports "${spec}"`).toContain(spec);
          continue;
        }
        expect(resolve(file, "..", spec).startsWith(root), `${file} imports "${spec}"`).toBe(true);
      }
    }
  });
});
