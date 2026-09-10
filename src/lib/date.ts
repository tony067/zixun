/** 本地日期串 "YYYY-MM-DD"（避免 toISOString 的 UTC 偏移导致差一天） */
export function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
