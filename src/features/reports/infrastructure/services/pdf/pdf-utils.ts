import PDFDocument from "pdfkit";

export const COLORS = {
  PRIMARY: "#1e3a8a",
  SECONDARY: "#3b82f6",
  ACCENT: "#10b981",
  WARNING: "#f59e0b",
  DANGER: "#ef4444",
  TEXT: "#1f2937",
  LIGHT_GRAY: "#f3f4f6",
  MEDIUM_GRAY: "#e5e7eb",
  WHITE: "#ffffff",
} as const;

export const DIMENSIONS = {
  PAGE_WIDTH: 595.28,
  PAGE_HEIGHT: 841.89,
  MARGIN: 50,
  HEADER_HEIGHT: 80,
  FOOTER_HEIGHT: 40,
} as const;

export const SPACING = {
  TITLE: 25,
  SECTION: 20,
  ITEM: 12,
} as const;

export const TABLE = {
  HEADER_COLOR: COLORS.PRIMARY,
  BORDER_COLOR: COLORS.MEDIUM_GRAY,
  ROW_HEIGHT: 30,
  HEADER_HEIGHT: 35,
  CELL_PADDING: 8,
} as const;

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMonth(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-ES", {
    month: "short",
    year: "numeric",
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: COLORS.ACCENT,
    expired: COLORS.DANGER,
    inProgress: COLORS.WARNING,
    active: COLORS.ACCENT,
    paid: COLORS.ACCENT,
    overdue: COLORS.DANGER,
    exceeded: COLORS.DANGER,
    warning: COLORS.WARNING,
    good: COLORS.ACCENT,
  };
  return colors[status] || COLORS.TEXT;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: "Completada",
    expired: "Expirada",
    inProgress: "En Progreso",
    active: "Activa",
    paid: "Pagada",
    overdue: "Vencida",
    exceeded: "Excedido",
    warning: "Alerta",
    good: "Bueno",
  };
  return labels[status] || status;
}

export function checkPageBreak(
  doc: typeof PDFDocument,
  requiredHeight: number
): boolean {
  const currentY = doc.y;
  const footerSpace = DIMENSIONS.FOOTER_HEIGHT + 20;
  return currentY + requiredHeight > DIMENSIONS.PAGE_HEIGHT - footerSpace;
}
