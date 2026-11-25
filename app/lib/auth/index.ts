import { cookies } from "next/headers";
import {
  AUTH_COOKIE_NAMES,
  RefreshTokenInvalidError,
  SESSION_USER_ID_COOKIE,
  buildAuthCookieAttributes,
  isExpiringSoon,
  performRefresh,
  resolveSessionUserId,
} from "@/app/lib/auth/session-cookies";

export { RefreshTokenInvalidError };

export async function isTokenExpired() {
  const cookieStore = await cookies();
  const expiresAt = cookieStore.get("tokenExpiresAt")?.value;
  return isExpiringSoon(expiresAt);
}

async function clearSessionCookies() {
  const cookieStore = await cookies();
  AUTH_COOKIE_NAMES.forEach((name) => cookieStore.delete(name));
}

// Renueva la sesión con el refresh token de las cookies. Funciona aunque la cookie del
// access token ya no exista (vencida y borrada por el navegador): el userId se toma de la
// cookie dedicada `sessionUserId`. Solo debe llamarse donde se pueden escribir cookies
// (Route Handlers / Server Actions).
export async function refreshToken() {
  const cookieStore = await cookies();

  const refreshTokenValue = cookieStore.get("refreshToken")?.value;
  const userId = resolveSessionUserId(
    cookieStore.get("token")?.value,
    cookieStore.get(SESSION_USER_ID_COOKIE)?.value,
  );

  if (!refreshTokenValue || !userId) {
    await clearSessionCookies();
    throw new RefreshTokenInvalidError("Refresh token not found");
  }

  let data;
  try {
    data = await performRefresh(refreshTokenValue, userId);
  } catch (error) {
    if (error instanceof RefreshTokenInvalidError) {
      // No reintentar: cerramos la sesión localmente para que la siguiente
      // petición se trate como no autenticada y mande al usuario a login.
      await clearSessionCookies();
    }
    throw error;
  }

  // Reemplazamos SIEMPRE token, refreshToken y sus expiraciones por los
  // valores nuevos de la respuesta. Nunca reutilizar el refreshToken
  // anterior: el backend ya lo invalidó al consumirlo.
  cookieStore.set("token", data.token, buildAuthCookieAttributes(data.tokenExpiresAt));
  cookieStore.set("tokenExpiresAt", data.tokenExpiresAt, buildAuthCookieAttributes(data.tokenExpiresAt));

  const refreshTokenExpiresAt = data.refreshTokenExpiresAt;
  cookieStore.set("refreshToken", data.refreshToken, buildAuthCookieAttributes(refreshTokenExpiresAt));
  cookieStore.set(SESSION_USER_ID_COOKIE, userId, buildAuthCookieAttributes(refreshTokenExpiresAt));

  if (refreshTokenExpiresAt) {
    cookieStore.set("refreshTokenExpiresAt", refreshTokenExpiresAt, buildAuthCookieAttributes(refreshTokenExpiresAt));
  }

  return data.token;
}
