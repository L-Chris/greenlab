export function toNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

export function percent(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return `${(value * 100).toFixed(2)}%`;
}

export function fixed(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined) return "-";
  return value.toFixed(digits);
}
