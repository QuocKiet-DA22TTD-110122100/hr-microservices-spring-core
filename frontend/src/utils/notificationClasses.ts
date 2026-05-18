export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export const getNotificationClasses = (type: NotificationType) => {
  if (type === 'success') return 'bg-green-50 text-green-800 border border-green-200';
  if (type === 'error') return 'bg-red-50 text-red-800 border border-red-200';
  if (type === 'warning') return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
  return 'bg-blue-50 text-blue-800 border border-blue-200';
};