/**
 * A setting is a default value plus a parser that turns whatever was persisted
 * (possibly stale, hand-edited or from an older version) back into a valid value.
 * Returning `undefined` from `parse` means "unusable, fall back to the default".
 */
export interface Field<T> {
  default: T;
  parse(raw: unknown): T | undefined;
}

export type Schema = Record<string, Field<any>>;

/** The settings object a schema describes, e.g. `{ fontSize: number; theme: "light" | "dark" }`. */
export type ValuesOf<S extends Schema> = { [K in keyof S]: S[K]["default"] };

/** Identity helper that keeps the literal types of each field. */
export function defineSettings<S extends Schema>(schema: S): S {
  return schema;
}

/** One value out of a fixed list, such as a theme or a font. */
export function choice<const T extends string>(options: readonly T[], fallback: NoInfer<T>): Field<T> {
  return {
    default: fallback,
    parse: (raw) => (typeof raw === "string" && options.includes(raw as T) ? (raw as T) : undefined),
  };
}

export function toggle(fallback: boolean): Field<boolean> {
  return { default: fallback, parse: (raw) => (typeof raw === "boolean" ? raw : undefined) };
}

export interface NumberField extends Field<number> {
  min: number;
  max: number;
  step: number;
  /** Rounds to `step` and clamps into `[min, max]`. Use it for every write, not just loading. */
  clamp(value: number): number;
}

export function number(opts: { min: number; max: number; default: number; step?: number }): NumberField {
  const step = opts.step ?? 1;
  const decimals = (String(step).split(".")[1] ?? "").length;
  const clamp = (value: number) => {
    const rounded = Number((Math.round(value / step) * step).toFixed(decimals));
    return Math.min(opts.max, Math.max(opts.min, rounded));
  };
  return {
    default: opts.default,
    min: opts.min,
    max: opts.max,
    step,
    clamp,
    parse: (raw) => (typeof raw === "number" && Number.isFinite(raw) ? clamp(raw) : undefined),
  };
}

/** Escape hatch for app-specific shapes (colors, nested records, …). */
export function custom<T>(fallback: T, parse: (raw: unknown) => T | undefined): Field<T> {
  return { default: fallback, parse };
}
