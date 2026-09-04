export const won = (n: number): string =>
  `${Math.round(n).toLocaleString("ko-KR")}원`;

export const wonSigned = (n: number): string => {
  const v = Math.round(n);
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toLocaleString("ko-KR")}원`;
};

export const num = (n: number): string => Math.round(n).toLocaleString("ko-KR");

export const copies = (n: number): string => `${num(n)}권`;

export const pct = (n: number, digits = 0): string => `${n.toFixed(digits)}%`;
