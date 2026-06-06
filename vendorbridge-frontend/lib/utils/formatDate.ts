import { format } from 'date-fns';

export function formatDate(dateString: string | Date, pattern: string = 'dd MMM yyyy') {
  try {
    if (!dateString) return 'N/A';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, pattern);
  } catch (error) {
    return 'N/A';
  }
}
