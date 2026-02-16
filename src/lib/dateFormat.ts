const RU_MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
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

/** Validate: valid date and at least 16 years old. Returns error message or null. */
export function validateBirthDate(value: string): string | null {
  if (!value || !value.trim()) return "Введите дату рождения";
  const d = new Date(value.trim() + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "Некорректная дата";
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  if (age < 16) return "Должно быть не менее 16 лет";
  return null;
}
