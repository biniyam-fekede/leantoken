// Turns an array of rows (arrays of values) into CSV text, quoting values that need it.
export function toCsv(rows) {
  const cell = (v) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(',')).join('\n') + '\n';
}
