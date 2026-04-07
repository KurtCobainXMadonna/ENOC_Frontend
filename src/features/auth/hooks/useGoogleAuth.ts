import { useEffect } from 'react';

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          theme?: string;
          size?: string;
          width?: number;
        }
      ) => void;
    };
  };
};

export function useGoogleAuth(onToken: (idToken: string) => void) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const google = (window as typeof window & { google?: GoogleIdentity }).google;
      if (!google) return;
      google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          onToken(response.credential);
        },
      });
      google.accounts.id.renderButton(
        document.getElementById('google-btn')!,
        { theme: 'filled_black', size: 'large', width: 280 }
      );
    };
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);
}