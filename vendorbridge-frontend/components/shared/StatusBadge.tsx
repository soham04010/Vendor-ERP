interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status?.toLowerCase() || '';

  const getStyles = () => {
    switch (normalized) {
      case 'active':
      case 'open':
      case 'paid':
      case 'approved':
      case 'selected':
        return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300';
      case 'pending':
      case 'draft':
      case 'invited':
      case 'generated':
      case 'sent':
      case 'issued':
      case 'acknowledged':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
      case 'inactive':
      case 'blocked':
      case 'closed':
      case 'cancelled':
      case 'rejected':
      case 'void':
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300';
      case 'awarded':
      case 'delivered':
      case 'submitted':
      case 'viewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${getStyles()}`}>
      {status}
    </span>
  );
}
