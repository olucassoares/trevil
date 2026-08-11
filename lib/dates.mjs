/**
 * Normaliza datas vindas do PostgreSQL ou de adaptadores que retornam
 * timestamps sem informação explícita de fuso horário.
 *
 * @param {string} value
 * @returns {Date | null}
 */
export function parseStoredDate(value) {
  if (!value?.trim()) return null;

  const normalized = value.trim().includes("T")
    ? value.trim()
    : value.trim().replace(" ", "T");
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const parsed = new Date(hasTimezone ? normalized : `${normalized}Z`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * @param {string} value
 * @param {Intl.DateTimeFormat} formatter
 * @param {string} [fallback]
 */
export function formatStoredDate(value, formatter, fallback = "Data indisponível") {
  const parsed = parseStoredDate(value);
  return parsed ? formatter.format(parsed) : fallback;
}
