import { isJwtDecoded, mapUserFromToken } from "@/app/utils/mapUser";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function isTokenExpired() {
  const cookieStore = await cookies();

  const expiresAt = cookieStore.get("tokenExpiresAt")?.value;

  if (!expiresAt) {
    return true;
  }

  const expiration = new Date(expiresAt).getTime();

  const now = Date.now();

  // margen de 5 minutos
  const fiveMinutes = 5 * 60 * 1000;

  return expiration - now <= fiveMinutes;
}

interface RefreshSessionResponse {
  token: string;
  tokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt?: string;
}

// El refresh token del backend es de un solo uso: al usarlo con éxito, el
// backend lo invalida y devuelve uno nuevo. Si se reintenta con el token
// viejo (p. ej. porque no se guardó a tiempo, o porque una segunda llamada
// concurrente lo disparó en paralelo) el backend responde 401
// "RefreshTokenNotValid". No es un error recuperable reintentando.
export class RefreshTokenInvalidError extends Error {
  constructor(message = "RefreshTokenNotValid") {
    super(message);
    this.name = "RefreshTokenInvalidError";
  }
}

// Varias peticiones en paralelo (Promise.all en las páginas) pueden ver el
// mismo token expirado a la vez. Sin este lock, cada una dispara su propio
// refresh-session con el mismo refreshToken; como el backend lo invalida al
// usarlo, solo la primera tiene éxito y el resto falla con RefreshTokenNotValid
// aunque el usuario sí tenga sesión válida. Deduplicamos para que todas las
// llamadas concurrentes esperen el mismo resultado en vez de disparar su
// propio refresh en paralelo.
let refreshPromise: Promise<RefreshSessionResponse> | null = null;

async function requestRefreshSession(refreshTokenValue: string, userId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/authentication/refresh-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
      // Token ya usado, revocado o expirado (vigencia de 7 días): no hay
      // forma de recuperarlo reintentando, hay que cerrar la sesión.
      throw new RefreshTokenInvalidError();
    }

    throw new Error("Failed to refresh token");
  }

  return (await response.json()) as RefreshSessionResponse;
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

  if (!refreshPromise) {
    refreshPromise = requestRefreshSession(refreshTokenValue, user.id).finally(() => {
      refreshPromise = null;
    });
  }

  let data: RefreshSessionResponse;

  try {
    data = await refreshPromise;
  } catch (error) {
    if (error instanceof RefreshTokenInvalidError) {
      // No reintentar: cerramos la sesión localmente para que la siguiente
      // petición se trate como no autenticada y mande al usuario a login.
      await clearSessionCookies();
    }
    throw error;
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
  };

  // Reemplazamos SIEMPRE token, refreshToken y sus expiraciones por los
  // valores nuevos de la respuesta. Nunca reutilizar el refreshToken
  // anterior: el backend ya lo invalidó al consumirlo.
  cookieStore.set("token", data.token, cookieOptions);
  cookieStore.set("tokenExpiresAt", data.tokenExpiresAt, cookieOptions);
  cookieStore.set("refreshToken", data.refreshToken, cookieOptions);

  if (data.refreshTokenExpiresAt) {
    cookieStore.set("refreshTokenExpiresAt", data.refreshTokenExpiresAt, cookieOptions);
  }

  return data.token;
}
