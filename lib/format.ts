const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export const formatPrice = (value: number) => EUR.format(value);

/** "42,5" -> 42.5, letters (TU, L) sort last */
export const sizeValue = (size: string) => {
  const n = Number(size.replace(",", "."));
  return Number.isFinite(n) ? n : 999;
};
