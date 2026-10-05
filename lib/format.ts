const whole = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 });

/** 690 → « 690 € », 12.9 → « 12,90 € » */
export const formatPrice = (value: number) => (Number.isInteger(value) ? whole : cents).format(value);

/** "42,5" -> 42.5, letters (TU, L) sort last */
export const sizeValue = (size: string) => {
  const n = Number(size.replace(",", "."));
  return Number.isFinite(n) ? n : 999;
};
