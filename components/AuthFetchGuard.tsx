'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/app/store/useUserStore';

type PatchedWindow = Window & { __authFetchPatched?: boolean };

const resolveRequestUrl = (input: RequestInfo | URL) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
};

// Operaciones masivas (ej. importar clientes desde Excel) disparan muchas
// peticiones seguidas; si UNA sola recibe 401 (token venciendo a mitad del
// proceso, hipo transitorio del backend, etc.) no queremos que el guard
// navegue de golpe a /login y aborte todo el lote en curso, perdiendo el
// rastro de qué filas ya se crearon. Mientras `redirectSuppressCount > 0`,
// un 401 se deja pasar como un error normal para que lo maneje quien hizo
// la petición (por ejemplo, agregándolo a la lista de errores de la fila).
let redirectSuppressCount = 0;

export const withAuthRedirectSuppressed = async <T,>(task: () => Promise<T>): Promise<T> => {
  redirectSuppressCount += 1;
  try {
    return await task();
  } finally {
    redirectSuppressCount -= 1;
  }
};

export function AuthFetchGuard() {
  useEffect(() => {
    const win = window as PatchedWindow;
    if (win.__authFetchPatched) return;
    win.__authFetchPatched = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);

      const url = resolveRequestUrl(args[0]);
      const isAuthEndpoint = url.includes('/api/login') || url.includes('/api/logout');

      if (
        response.status === 401 &&
        !isAuthEndpoint &&
        redirectSuppressCount === 0 &&
        window.location.pathname !== '/login'
      ) {
        useUserStore.getState().logout();
        originalFetch('/api/logout', { method: 'POST' }).catch(() => {});
        window.location.href = '/login';
      }

      return response;
    };
  }, []);

  return null;
}
