export function formatDate(date: any): string {
  if (!date) return "";

  try {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      return String(date);
    }

    return dateObj.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return String(date);
  }
}

export function formatDateOnly(date: any): string {
  if (!date) return "";

  try {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      return String(date);
    }

    return dateObj.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    return String(date);
  }
}
