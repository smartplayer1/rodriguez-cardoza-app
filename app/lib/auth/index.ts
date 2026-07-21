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
  refreshToken?: string;
}

// Varias peticiones en paralelo (Promise.all en las páginas) pueden ver el
// mismo token expirado a la vez. Sin este lock, cada una dispara su propio
// refresh-session con el mismo refreshToken; si el backend lo rota/invalida
// al usarlo, solo la primera tiene éxito y el resto falla con 401 aunque el
// usuario sí tenga sesión válida. Deduplicamos para que todas esperen el
// mismo resultado.
let refreshPromise: Promise<RefreshSessionResponse> | null = null;

async function requestRefreshSession(refreshToken: string, userId: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/authentication/refresh-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
        userId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  return (await response.json()) as RefreshSessionResponse;
}

export async function refreshToken() {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    throw new Error("Refresh token not found");
  }

  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Token not found");
  }
  const decoded = jwt.decode(token);

  if (!isJwtDecoded(decoded)) return;

  const user = mapUserFromToken(decoded);

  if (!refreshPromise) {
    refreshPromise = requestRefreshSession(refreshToken, user.id).finally(() => {
      refreshPromise = null;
    });
  }

  const data = await refreshPromise;

  cookieStore.set("token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  cookieStore.set("tokenExpiresAt", data.tokenExpiresAt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  if (data.refreshToken) {
    cookieStore.set("refreshToken", data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  }

  return data.token;
}
