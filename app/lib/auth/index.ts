import { isJwtDecoded, mapUserFromToken } from "@/app/utils/mapUser";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import {
  RefreshTokenInvalidError,
  buildAuthCookieAttributes,
  isExpiringSoon,
  performRefresh,
} from "@/app/lib/auth/session-cookies";

export { RefreshTokenInvalidError };

export async function isTokenExpired() {
  const cookieStore = await cookies();
  const expiresAt = cookieStore.get("tokenExpiresAt")?.value;
  return isExpiringSoon(expiresAt);
}

async function clearSessionCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  cookieStore.delete("tokenExpiresAt");
  cookieStore.delete("refreshToken");
  cookieStore.delete("refreshTokenExpiresAt");
}

export async function refreshToken() {
  const cookieStore = await cookies();

  const refreshTokenValue = cookieStore.get("refreshToken")?.value;
  const token = cookieStore.get("token")?.value;

  if (!refreshTokenValue || !token) {
    await clearSessionCookies();
    throw new RefreshTokenInvalidError("Refresh token not found");
  }

  const decoded = jwt.decode(token);

  if (!isJwtDecoded(decoded)) {
    await clearSessionCookies();
    throw new RefreshTokenInvalidError("Invalid session token");
  }

  const user = mapUserFromToken(decoded);

  let data;
  try {
    data = await performRefresh(refreshTokenValue, user.id);
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

  if (refreshTokenExpiresAt) {
    cookieStore.set("refreshTokenExpiresAt", refreshTokenExpiresAt, buildAuthCookieAttributes(refreshTokenExpiresAt));
  }

  return data.token;
}
