import i18n from "@/i18n";

const RU_MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const RU_MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "мая", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];

/** Format ISO date (YYYY-MM-DD) as "15 марта 1990" */
export function formatDateRu(isoDate: string): string {
  if (!isoDate || !isoDate.trim()) return "";
  const d = new Date(isoDate.trim() + "T12:00:00");
  if (Number.isNaN(d.getTime())) return isoDate;
  const day = d.getDate();
  const month = RU_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Format ISO date (YYYY-MM-DD) as "12 июн" (short, for date navigator) */
export function formatDateShort(isoDate: string): string {
  if (!isoDate || !isoDate.trim()) return "";
  const d = new Date(isoDate.trim() + "T12:00:00");
  if (Number.isNaN(d.getTime())) return isoDate;
  const day = d.getDate();
  const month = RU_MONTHS_SHORT[d.getMonth()];
  return `${day} ${month}`;
}

/** Validate: valid date and at least 16 years old. Returns error message or null. */
export function validateBirthDate(value: string): string | null {
  if (!value || !value.trim()) return i18n.t("errors.enterDob");
  const d = new Date(value.trim() + "T12:00:00");
  if (Number.isNaN(d.getTime())) return i18n.t("errors.invalidDate");
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  if (age < 16) return i18n.t("errors.minAge");
  return null;
}

/**
 * Format date as DD.MM.YYYY for medical card "Актуально на" display.
 * Accepts ISO string (YYYY-MM-DD), timestamp, or Date object.
 */
export function formatMedicalDate(date: string | number | Date): string {
  if (!date) return "";
  const d = typeof date === "string"
    ? new Date(date.includes("T") ? date : date + "T12:00:00")
    : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
