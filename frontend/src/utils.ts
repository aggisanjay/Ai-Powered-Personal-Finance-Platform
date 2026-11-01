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

export const money = (n: number | string | null | undefined, opts: { sign?: boolean; decimals?: number } = {}) => {
  const v = Number(n ?? 0);
  const d = opts.decimals ?? 2;
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const sign = v < 0 ? '-' : opts.sign && v > 0 ? '+' : '';
  return `${sign}$${s}`;
};

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};
