import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRackStore } from "../store/rackStore";

export function useRackSocket(sessionId: string) {
  const clientRef = useRef<Client | null>(null);
  const { applyAction } = useRackStore();

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 3000,
      onConnect: () => {
        // Suscribirse a mensajes del servidor para esta sesión
        client.subscribe(`/topic/session/${sessionId}`, (msg) => {
          const event = JSON.parse(msg.body);
          applyAction(event.action, event.data);
        });
      },
    });

    clientRef.current = client;
    client.activate();

    return () => { client.deactivate(); };
  }, [sessionId]);

  // Función para enviar comandos al backend
  const sendCommand = (action: string, data: Record<string, unknown>) => {
    clientRef.current?.publish({
      destination: `/app/sessions/${sessionId}`,
      body: JSON.stringify({
        entityType: "channelrack",
        action,
        data,
      }),
    });
  };

  return { sendCommand };
}