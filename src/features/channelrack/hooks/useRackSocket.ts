import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface RackEvent {
  type: string;
  payload: any;
  triggeredBy: string;
}

export function useRackSocket(projectId: string, onEvent: (e: RackEvent) => void) {
  const clientRef = useRef<Client | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 3000,
      onConnect: () => {
        // Suscribirse a eventos del rack del proyecto
        client.subscribe(`/topic/rack/${projectId}`, (msg) => {
          onEventRef.current(JSON.parse(msg.body));
        });
        // Suscribirse a errores personales
        client.subscribe('/user/queue/errors', (msg) => {
          console.error('[WS Error]', msg.body);
        });
        // Unirse al proyecto
        client.publish({ destination: `/app/project/${projectId}/join` });
        // Cargar estado inicial del rack
        client.publish({ destination: `/app/rack/${projectId}/load` });
      },
      onStompError: (frame) => {
        console.error('[STOMP Error]', frame.headers['message'], frame.body);
      },
    });
    clientRef.current = client;
    client.activate();

    return () => {
      if (client.connected) {
        client.publish({ destination: `/app/project/${projectId}/leave` });
      }
      client.deactivate();
      clientRef.current = null;
    };
  }, [projectId]);

  const sendCommand = useCallback((destination: string, body?: object) => {
    const client = clientRef.current;

    if (!client?.connected) {
      return;
    }

    client.publish({
      destination,
      body: body ? JSON.stringify(body) : undefined,
    });
  }, []);

  const toggleStep = (channelId: string, stepIndex: number) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/step`, { stepIndex });

  const addChannel = (name: string, soundId: string) =>
    sendCommand(`/app/rack/${projectId}/channel/add`, { name, soundId });

  const removeChannel = (channelId: string) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/remove`);

  const toggleMute = (channelId: string) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/mute`);

  const setVolume = (channelId: string, volume: number) =>
    sendCommand(`/app/rack/${projectId}/channel/${channelId}/volume`, { volume: volume / 100 });

  return { toggleStep, addChannel, removeChannel, toggleMute, setVolume };
}