/**
 * Sets the end date with the last hour of the day (23:59:59.999)
 * to ensure all transactions from the day are included
 * @param date - Base date
 * @returns New date with the last hour of the day
 */
export function setEndOfDay(date: Date): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Sets the start date with the first hour of the day (00:00:00.000)
 * @param date - Base date
 * @returns New date with the first hour of the day
 */
export function setStartOfDay(date: Date): Date {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}
