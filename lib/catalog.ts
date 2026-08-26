export function fmtPrice(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export function offPct(was: number, now: number): number {
  return Math.round((1 - now / was) * 100);
}
