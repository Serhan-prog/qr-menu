export const DEFAULT_RESTAURANT_NAME = 'QR Menü';

export function restaurantDisplayName(name) {
  return name?.trim() || DEFAULT_RESTAURANT_NAME;
}

export function restaurantInitials(name) {
  const words = restaurantDisplayName(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return words
    .map((word) => word[0])
    .join('')
    .toLocaleUpperCase('tr-TR');
}
