export function packageStatusBadgeClass(status: string | null | undefined): string {
  const s = (status ?? 'ACTIVE').toString().trim().toUpperCase();
  switch (s) {
    case 'INACTIVE':
      return 'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white bg-red-600 shadow-sm hover:bg-red-700 transition-colors';
    case 'COMPLITED':
      return 'inline-flex items-center rounded-full border border-green-300 bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700';
    case 'IN_USE':
      return 'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700';
    case 'ACTIVE':
    default:
      return 'inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700';
  }
}
