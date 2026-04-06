import { useEffect } from 'react';
import { api } from '../../../shared/api/client';
import { useSessionStore } from '../store/sessionStore';

export function useSession(toolId: string) {
  const setSessionId = useSessionStore(s => s.setSessionId);

  useEffect(() => {
    let isActive = true;

    api.post('/api/sessions', {
      toolId,
      userId: 'extraido-del-jwt',
      metadata: {},
    }).then(({ data }) => {
      const createdSessionId = data?.sessionId ?? data?.id;

      if (isActive && typeof createdSessionId === 'string' && createdSessionId.length > 0) {
        setSessionId(createdSessionId);
      }
    }).catch((error) => {
      console.error('No se pudo crear la sesion de colaboracion', error);
    });

    return () => {
      isActive = false;
    };
  }, [toolId, setSessionId]);
}