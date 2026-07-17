const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24,
};

export function durationToSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `Invalid duration string: "${value}" (expected e.g. "15m", "7d")`,
    );
  }
  const [, amount, unit] = match;
  return parseInt(amount, 10) * UNIT_SECONDS[unit];
}
