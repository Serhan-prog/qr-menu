import axios from 'axios';
import { clearAuth, getToken } from '../utils/auth.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

function readCookie(name) {
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

let currentCsrfToken = null;

function csrfIgnoredPath(url = '') {
  const path = url.split('?')[0];
  return path === '/api/auth/login'
    || path === '/api/auth/logout'
    || path === '/api/orders'
    || path.startsWith('/api/feedback/order/')
    || path === '/api/waiter-calls'
    || path === '/api/bill-requests';
}

function requiresCsrfHeader(config) {
  const method = config.method?.toUpperCase();
  return method
    && !['GET', 'HEAD', 'OPTIONS'].includes(method)
    && !csrfIgnoredPath(config.url);
}

api.interceptors.request.use(async (config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!token && requiresCsrfHeader(config)) {
    let csrfToken = currentCsrfToken || readCookie('XSRF-TOKEN');
    if (!csrfToken) {
      const response = await api.get('/api/csrf');
      csrfToken = response.data?.token || readCookie('XSRF-TOKEN');
      currentCsrfToken = csrfToken;
    }

    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
