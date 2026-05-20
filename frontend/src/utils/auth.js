const USER_KEY = 'qr_menu_user';
const TOKEN_KEY = 'qr_menu_token';

export function saveAuth(auth) {
  localStorage.setItem(TOKEN_KEY, auth.token);
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
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getUser());
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
