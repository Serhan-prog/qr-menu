const USER_KEY = 'qr_menu_user';

export function saveAuth(auth) {
  localStorage.setItem(USER_KEY, JSON.stringify({
    userId: auth.userId,
    restaurantId: auth.restaurantId,
    email: auth.email,
    fullName: auth.fullName,
    role: auth.role,
  }));
}

export function getUser() {
  const value = localStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
}

export function clearAuth() {
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getUser());
}
