/**
 * Format a date string (ISO or UTC) to La Paz, Bolivia timezone.
 * If the input is a naive date string, it's treated as UTC.
 */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('es-BO', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
