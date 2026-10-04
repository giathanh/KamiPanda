import { reactive, watch } from "vue";
import type { Schema, ValuesOf } from "./schema";

export interface SettingsStoreOptions {
  /** localStorage key the settings are saved under. */
  key: string;
  /** Defaults to `localStorage`; pass another Storage for tests. */
  storage?: Storage;
}

export interface SettingsStore<S extends Schema> {
  /** Reactive settings. Write to it directly; changes are saved automatically. */
  settings: ValuesOf<S>;
  schema: S;
  /** Restores the given keys (or every key) to their defaults. */
  reset(keys?: (keyof S)[]): void;
  /** True when every given key (or every key) still holds its default value. */
  isDefault(keys?: (keyof S)[]): boolean;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  return ka.length === kb.length && ka.every((k) => deepEqual((a as any)[k], (b as any)[k]));
}

export function createSettingsStore<S extends Schema>(schema: S, options: SettingsStoreOptions): SettingsStore<S> {
  const storage = options.storage ?? localStorage;
  const keys = Object.keys(schema) as (keyof S & string)[];
  // Defaults are cloned on every use so that mutating the live settings never touches the schema.
  const defaultOf = (key: keyof S) => structuredClone(schema[key].default);

  function load(): ValuesOf<S> {
    let raw: Record<string, unknown> | null = null;
    try {
      const parsed = JSON.parse(storage.getItem(options.key) ?? "null");
      if (parsed && typeof parsed === "object") raw = parsed;
    } catch {
      // Corrupt JSON: start from defaults.
    }
    const values = {} as ValuesOf<S>;
    for (const key of keys) values[key] = (raw ? schema[key].parse(raw[key]) : undefined) ?? defaultOf(key);
    return values;
  }

  const settings = reactive(load()) as ValuesOf<S>;

  watch(
    settings,
    () => {
      try {
        storage.setItem(options.key, JSON.stringify(settings));
      } catch {
        // Storage full or unavailable: keep running with in-memory settings.
      }
    },
    { deep: true, immediate: true },
  );

  return {
    settings,
    schema,
    reset(only = keys) {
      for (const key of only) settings[key] = defaultOf(key);
    },
    isDefault(only = keys) {
      return only.every((key) => deepEqual(settings[key], schema[key].default));
    },
  };
}
