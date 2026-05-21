import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient: Client | null = null;
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_API_BASE_URL;

export function createStompClient(onConnect?: () => void): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
    reconnectDelay: 3000,

    // Heartbeats — must match the server config (10s in WebSocketConfig.java).
    // Without these, idle connections die silently after a minute or two.
    heartbeatIncoming: 10000,    // expect a server ping every 10s
    heartbeatOutgoing: 10000,    // send a ping to the server every 10s

    onConnect: () => {
      console.log("✅ Conectado al WebSocket");
      onConnect?.();
    },
    onDisconnect: () => console.log("❌ Desconectado"),
    onStompError: (frame) => console.error("STOMP error:", frame),
    onWebSocketClose: (evt) => {
      // Useful during load tests — tells you why the connection died.
      console.warn("WebSocket closed:", evt.code, evt.reason);
    },
  });

  stompClient = client;
  client.activate();
  return client;
}

export function getStompClient() {
  return stompClient;
}
