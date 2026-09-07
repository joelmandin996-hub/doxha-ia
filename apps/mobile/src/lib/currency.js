export function formatAmount(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}
