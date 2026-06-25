export function formatPrice(price: number): string {
  return `KRW ${price.toLocaleString()}`;
}

export function formatOrderNumber(date: Date, seq: number): string {
  const y = date.getFullYear().toString();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const s = seq.toString().padStart(4, '0');
  return `${y}${m}${d}-${s}`;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  const sec = date.getSeconds().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${sec}`;
}

export function formatPhone(parts: string[]): string {
  return parts.filter(Boolean).join('-');
}

export function validateOrderPassword(pw: string): boolean {
  return pw.length >= 4;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
