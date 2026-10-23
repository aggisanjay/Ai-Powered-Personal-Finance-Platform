export function toNum(val: number | string | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

export function formatMoney(val: number | string | null | undefined, decimals = 2): string {
  return toNum(val).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatFixed(val: number | string | null | undefined, decimals = 0): string {
  return toNum(val).toFixed(decimals);
}
