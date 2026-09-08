'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/app/store/useUserStore';

type PatchedWindow = Window & { __authFetchPatched?: boolean };

const resolveRequestUrl = (input: RequestInfo | URL) => {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
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

      if (response.status === 401 && !isAuthEndpoint && window.location.pathname !== '/login') {
        useUserStore.getState().logout();
        originalFetch('/api/logout', { method: 'POST' }).catch(() => {});
        window.location.href = '/login';
      }

      return response;
    };
  }, []);

  return null;
}
