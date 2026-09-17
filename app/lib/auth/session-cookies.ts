// Utilidades de sesión compartidas entre contextos que SÍ pueden usar
// `next/headers` (Route Handlers, Server Components) y contextos que NO
// pueden (Middleware, que por defecto corre en el runtime de Edge y no
// admite el paquete `jsonwebtoken` ni otras APIs de Node). Este módulo no
// importa nada de eso para poder usarse desde cualquiera de los dos.

export const AUTH_COOKIE_NAMES = [
  'token',
  'tokenExpiresAt',
  'refreshToken',
  'refreshTokenExpiresAt',
] as const;

export interface RefreshSessionResult {
  token: string;
  tokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt?: string;
}

// El refresh token del backend es de un solo uso: al usarlo con éxito, el
// backend lo invalida y devuelve uno nuevo. Un 401 en este endpoint
// significa que el refresh token ya no sirve (usado, revocado o expirado)
// y no es recuperable reintentando.
export class RefreshTokenInvalidError extends Error {
  constructor(message = 'RefreshTokenNotValid') {
    super(message);
    this.name = 'RefreshTokenInvalidError';
  }
}

const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export function isExpiringSoon(
  expiresAtIso: string | undefined | null,
  marginMs = REFRESH_MARGIN_MS,
): boolean {
  if (!expiresAtIso) return true;

  const expiration = new Date(expiresAtIso).getTime();
  if (Number.isNaN(expiration)) return true;

  return expiration - Date.now() <= marginMs;
}

// Sin `maxAge`/`expires`, las cookies quedan como "session cookies": el
// navegador las borra al cerrarse, matando la sesión aunque el refresh
// token siga vigente en el backend. Lo calculamos a partir de la fecha de
// expiración real que manda el backend para que la cookie dure exactamente
// lo mismo que el token que contiene.
export function buildAuthCookieAttributes(expiresAtIso?: string) {
  const base = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
  };

  if (!expiresAtIso) return base;

  const expiresMs = new Date(expiresAtIso).getTime();
  if (Number.isNaN(expiresMs)) return base;

  const maxAge = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
  return { ...base, maxAge };
}

// Decodifica el payload de un JWT sin verificar la firma. Solo sirve para
// leer claims públicos (el userId, para armar el body del refresh) desde
// contextos edge-safe como el middleware, donde `jsonwebtoken` no puede
// importarse porque depende de APIs de Node no disponibles en Edge.
export function decodeJwtPayloadUnsafe(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const json = atob(padded);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Deduplicación de refresh concurrente: si varias peticiones llegan casi al
// mismo tiempo con el access token vencido, todas comparten esta misma
// promesa en vez de disparar cada una su propio refresh-session (el backend
// invalida el refresh token en el primer uso, así que una segunda llamada
// en paralelo con el mismo token fallaría con RefreshTokenNotValid aunque
// la sesión sea válida).
let refreshPromise: Promise<RefreshSessionResult> | null = null;

async function requestRefreshSession(
  refreshTokenValue: string,
  userId: string,
): Promise<RefreshSessionResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/authentication/refresh-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // El backend espera exactamente este shape (PascalCase). UserId debe
      // corresponder al dueño de ESTE refresh token.
      body: JSON.stringify({
        RefreshToken: refreshTokenValue,
        UserId: userId,
      }),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new RefreshTokenInvalidError();
    }
    throw new Error('Failed to refresh token');
  }

  return (await response.json()) as RefreshSessionResult;
}

export function performRefresh(
  refreshTokenValue: string,
  userId: string,
): Promise<RefreshSessionResult> {
  if (!refreshPromise) {
    refreshPromise = requestRefreshSession(refreshTokenValue, userId).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}
