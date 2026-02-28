import { useEffect, useRef, useCallback, useState } from 'react';
import type { WsMessage } from './types';

export function useExecutionWebSocket(onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/api/ws/execution`;
    const ws = new WebSocket(url);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connect, 3000);
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        onMessageRef.current(msg);
      } catch { /* ignore parse errors */ }
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected };
}
