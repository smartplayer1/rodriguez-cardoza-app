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
// un 401 que sobrevive al refresh+retry se deja pasar como un error normal
// para que lo maneje quien hizo la petición (por ejemplo, agregándolo a la
// lista de errores de la fila), en vez de forzar el logout.
let redirectSuppressCount = 0;

export const withAuthRedirectSuppressed = async <T,>(task: () => Promise<T>): Promise<T> => {
  redirectSuppressCount += 1;
  try {
    return await task();
  } finally {
    redirectSuppressCount -= 1;
  }
};

// Un solo refresh en curso por sesión: si varias peticiones reciben 401 al
// mismo tiempo (access token vencido), todas esperan esta misma promesa en
// vez de disparar cada una su propio POST /api/auth/refresh.
let refreshPromise: Promise<boolean> | null = null;

const ensureSessionRefreshed = (originalFetch: typeof fetch) => {
  if (!refreshPromise) {
    refreshPromise = originalFetch('/api/auth/refresh', { method: 'POST' })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export function AuthFetchGuard() {
  useEffect(() => {
    const win = window as PatchedWindow;
    if (win.__authFetchPatched) return;
    win.__authFetchPatched = true;

    const originalFetch = window.fetch.bind(window);

    const runFetch = async (
      args: Parameters<typeof fetch>,
      attempt: number,
    ): Promise<Response> => {
      const response = await originalFetch(...args);

      const url = resolveRequestUrl(args[0]);
      const isAuthEndpoint =
        url.includes('/api/login') || url.includes('/api/logout') || url.includes('/api/auth/refresh');

      if (response.status !== 401 || isAuthEndpoint) {
        return response;
      }

      // 401: el access token expiró (o nunca fue válido). Intentamos un
      // refresh y reintentamos la petición original UNA sola vez — nunca
      // en un loop, y jamás para /login, /logout o /auth/refresh mismos.
      if (attempt === 0) {
        const refreshed = await ensureSessionRefreshed(originalFetch);
        if (refreshed) {
          return runFetch(args, 1);
        }
      }

      // Refresh token inválido/expirado, o la petición ya se reintentó una
      // vez y sigue en 401: la sesión terminó de verdad.
      if (redirectSuppressCount > 0 || window.location.pathname === '/login') {
        return response;
      }

      useUserStore.getState().logout();
      originalFetch('/api/logout', { method: 'POST' }).catch(() => {});
      window.location.href = '/login';

      return response;
    };

    window.fetch = (...args: Parameters<typeof fetch>) => runFetch(args, 0);
  }, []);

  return null;
}
