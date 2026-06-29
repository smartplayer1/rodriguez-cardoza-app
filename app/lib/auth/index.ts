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

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/authentication/refresh-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken,
        userId: user.id,
      }),
    },
  );

  console.log("Refresh token response:", response);

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();

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
