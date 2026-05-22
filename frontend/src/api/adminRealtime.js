import { qrMenuApi } from './qrMenuApi.js';

function websocketBaseUrl() {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

export function connectAdminNotifications({ restaurantId, onNotification, onStatusChange }) {
  if (!restaurantId) {
    return () => {};
  }

  let socket;
  let cancelled = false;
  let reconnectTimer;

  async function connect() {
    try {
      const { ticket } = await qrMenuApi.getWebSocketTicket();
      if (cancelled) {
        return;
      }

      const url = new URL('/ws/admin', websocketBaseUrl());
      url.searchParams.set('ticket', ticket);

      socket = new WebSocket(url.toString());
      socket.onopen = () => onStatusChange?.('connected');
      socket.onclose = () => {
        onStatusChange?.('closed');
        if (!cancelled) {
          reconnectTimer = window.setTimeout(connect, 3000);
        }
      };
      socket.onerror = () => onStatusChange?.('error');
      socket.onmessage = (event) => {
        try {
          onNotification?.(JSON.parse(event.data));
        } catch {
          // Ignore malformed realtime payloads.
        }
      };
    } catch {
      onStatusChange?.('error');
      if (!cancelled) {
        reconnectTimer = window.setTimeout(connect, 3000);
      }
    }
  }

  connect();

  return () => {
    cancelled = true;
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
    }
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close();
    }
  };
}
