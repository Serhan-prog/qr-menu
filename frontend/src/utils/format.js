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
  const data = error?.response?.data;
  if (data?.validationErrors) {
    return Object.values(data.validationErrors).join(', ');
  }
  return data?.message || 'İşlem tamamlanamadı';
}
