export function currency(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(Number(value || 0));
}

export function dateTime(value) {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function apiError(error) {
  return error?.response?.data?.message || 'Islem tamamlanamadi';
}
