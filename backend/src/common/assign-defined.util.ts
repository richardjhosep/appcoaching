/**
 * Like `Object.assign`, but skips source properties whose value is `undefined`.
 *
 * With `useDefineForClassFields` (default under tsconfig `target >= ES2022`),
 * every declared-but-absent `@IsOptional()` DTO field becomes an own property
 * set to `undefined` once class-transformer instantiates it — so a plain
 * `Object.assign(entity, dto)` on a partial update silently wipes out every
 * field the request didn't touch.
 */
export function assignDefined<T extends object>(
  target: T,
  source: Partial<T>,
): T {
  for (const key of Object.keys(source) as (keyof T)[]) {
    if (source[key] !== undefined) {
      target[key] = source[key];
    }
  }
  return target;
}
