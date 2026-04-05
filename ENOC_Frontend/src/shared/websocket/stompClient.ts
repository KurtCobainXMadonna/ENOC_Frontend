import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient: Client | null = null;

export function createStompClient(onConnect?: () => void): Client {
  const client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
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