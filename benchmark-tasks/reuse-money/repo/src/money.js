// Formats an integer amount of cents as US dollars, e.g. 123450 -> "$1,234.50".
export function formatMoney(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
