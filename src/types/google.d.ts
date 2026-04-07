interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: { client_id: string; callback: (r: { credential: string }) => void }) => void;
        renderButton: (el: HTMLElement, opts: object) => void;
        prompt: () => void;
      };
    };
  };
}