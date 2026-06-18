/**
 * Minimal typed result for operations that fail in expected ways (e.g. parsing
 * LLM output). Preferred over exceptions so failure paths are explicit and testable.
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: E };

export function ok<T, E>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function err<T, E>(errors: E): Result<T, E> {
  return { ok: false, errors };
}
