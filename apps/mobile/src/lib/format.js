import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(value, pattern = 'd MMM yyyy') {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  if (!isValid(date)) return '—';
  return format(date, pattern, { locale: fr });
}

export function formatDateTime(value) {
  return formatDate(value, "d MMM yyyy 'à' HH:mm");
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
