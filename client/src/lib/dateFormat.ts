export function parseRuntimeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(raw)
    ? raw.replace(/\s+/, 'T')
    : raw;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

const DATE_PARTS_FORMATTER = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
});

const TIME_PARTS_FORMATTER = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

export function formatArabicDate(value: unknown, fallback = '—'): string {
  const date = parseRuntimeDate(value);
  if (!date) return fallback;
  return DATE_PARTS_FORMATTER.format(date).replace(/،/g, '').trim();
}

export function formatArabicDateTime(value: unknown, fallback = '—'): string {
  const date = parseRuntimeDate(value);
  if (!date) return fallback;
  const dateText = DATE_PARTS_FORMATTER.format(date).replace(/،/g, '').trim();
  const timeText = TIME_PARTS_FORMATTER.format(date).replace(/،/g, '').trim();
  return `${dateText} — ${timeText}`;
}

export function formatArabicMonthDay(value: unknown, fallback = '—'): string {
  const date = parseRuntimeDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
    month: 'long',
    day: '2-digit',
  }).format(date).replace(/،/g, '').trim();
}

export function formatSortableDate(value: unknown, fallback = ''): string {
  const date = parseRuntimeDate(value);
  if (!date) return fallback;
  return date.toISOString();
}
