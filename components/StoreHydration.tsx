'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/app/store/useUserStore';
import type { AuthUser } from '@/app/type/user';

// Al arrancar la app, lo último que había en localStorage puede estar
// desactualizado (sesión cerrada desde otra pestaña, refresh token vencido
// mientras el navegador estaba cerrado, etc.). Este componente reconcilia
// ese estado contra la sesión real: consulta /api/auth/session (que valida
// la cookie httpOnly en el servidor) y ajusta el store al resultado, en vez
// de confiar ciegamente en lo que quedó guardado.
export function StoreHydration() {
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      useUserStore.persist.rehydrate();

      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await response.json().catch(() => null);

        if (cancelled) return;

        if (data?.authenticated && data.user) {
          const previousUser = useUserStore.getState().user;
          const incomingUser = data.user as AuthUser;

          // El endpoint de sesión solo trae los claims del token
          // (roles/permisos); si es el mismo usuario, conservamos los
          // campos de perfil (nombre de empleado, sucursal, etc.) que ya
          // estaban guardados desde el login.
          const mergedUser: AuthUser =
            previousUser && previousUser.id === incomingUser.id
              ? { ...previousUser, ...incomingUser }
              : incomingUser;

          useUserStore.getState().setUser(mergedUser);
        } else {
          useUserStore.getState().logout();
        }
      } catch {
        // Falla transitoria (red, etc.): no cerramos sesión agresivamente.
        // Dejamos lo que había en localStorage; si la sesión realmente ya
        // no es válida, la próxima petición real lo revelará con un 401.
        if (!cancelled && useUserStore.getState().status === 'loading') {
          useUserStore.getState().setStatus(
            useUserStore.getState().user ? 'authenticated' : 'unauthenticated',
          );
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
