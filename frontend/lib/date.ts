/** Alineado con `Inferencer._float_to_date` del backend (año decimal → fecha ISO). */
export function decimalYearToIsoDate(dec: number): string {
  const year = Math.floor(dec);
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInYear = isLeap ? 366 : 365;
  const decimalPart = dec - year;
  const daysElapsed = Math.floor(decimalPart * daysInYear);
  const start = new Date(Date.UTC(year, 0, 1));
  const ms = start.getTime() + daysElapsed * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Etiqueta legible para ejes: año decimal usado en `/plot_date`. */
export function formatDecimalYearTick(v: number): string {
  return decimalYearToIsoDate(v);
}
