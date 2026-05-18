import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatPhoneNumber(phone: string) {
  // Format: +356 99 123 456
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('356')) {
    return `+356 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
}

export function formatPrice(price: number) {
  // Format: €1,200/mo
  return `€${price.toLocaleString('en-US')}/mo`;
}
