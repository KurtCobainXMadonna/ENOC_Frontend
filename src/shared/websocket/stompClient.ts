import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient: Client | null = null;
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || import.meta.env.VITE_API_BASE_URL;

export function createStompClient(onConnect?: () => void): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${WS_BASE_URL}/ws`),
    reconnectDelay: 3000,
    onConnect: () => {
      console.log("✅ Conectado al WebSocket");
      onConnect?.();
    },
    onDisconnect: () => console.log("❌ Desconectado"),
    onStompError: (frame) => console.error("STOMP error:", frame),
  });

  stompClient = client;
  client.activate();
  return client;
}

export function getStompClient() {
  return stompClient;
}