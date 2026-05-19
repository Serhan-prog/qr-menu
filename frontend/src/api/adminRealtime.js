import { getToken } from '../utils/auth.js';

function websocketBaseUrl() {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  return apiBase.replace(/^http/, 'ws');
}

export function connectAdminNotifications({ restaurantId, onNotification, onStatusChange }) {
  const token = getToken();
  if (!restaurantId || !token) {
    return () => {};
  }

  const url = new URL('/ws/admin', websocketBaseUrl());
  url.searchParams.set('restaurantId', String(restaurantId));
  url.searchParams.set('token', token);

  const socket = new WebSocket(url.toString());

  socket.onopen = () => onStatusChange?.('connected');
  socket.onclose = () => onStatusChange?.('closed');
  socket.onerror = () => onStatusChange?.('error');
  socket.onmessage = (event) => {
    try {
      onNotification?.(JSON.parse(event.data));
    } catch {
      // Ignore malformed realtime payloads.
    }
  };

  return () => {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
  };
}
