import { format, parseISO, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatDate = (date: string | Date, formatStr = 'dd/MM/yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: vi });
  } catch {
    return '';
  }
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm:ss');
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const getDaysUntilPasswordExpiry = (expiryDate: string): number => {
  return differenceInDays(parseISO(expiryDate), new Date());
};

export const getPasswordExpiryWarning = (expiryDate: string): string | null => {
  const days = getDaysUntilPasswordExpiry(expiryDate);
  
  if (days < 0) {
    return 'Mật khẩu đã hết hạn. Vui lòng đãi mật khẩu.';
  }
  
  if (days <= 7) {
    return `Mật khẩu sẽ hết hạn trong ${days} ngày. Vui lòng đổi mật khẩu.`;
  }
  
  return null;
};
