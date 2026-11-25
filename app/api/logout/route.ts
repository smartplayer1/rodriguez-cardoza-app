import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAMES, buildAuthCookieAttributes } from '@/app/lib/auth/session-cookies';

// Revoca el refresh token en el backend (POST /v1/authentication/logout) y luego borra las
// cookies. La revocación es de mejor esfuerzo: si el access token ya venció o el backend no
// responde, igual se cierra la sesión local para no dejar al usuario atrapado.
export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const refreshTokenValue = cookieStore.get('refreshToken')?.value;

  if (token && refreshTokenValue && process.env.NEXT_PUBLIC_API_URL) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/authentication/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ RefreshToken: refreshTokenValue }),
        cache: 'no-store',
      });
    } catch (error) {
      console.error('LOGOUT: no se pudo revocar el refresh token', error);
    }
  }

  const response = NextResponse.json({ success: true });

  // Se borran con exactamente los mismos atributos (Path, SameSite, Secure)
  // con los que se crearon, para que el navegador las reconozca y elimine.
  AUTH_COOKIE_NAMES.forEach((name) => {
    response.cookies.set(name, '', { ...buildAuthCookieAttributes(), maxAge: 0 });
  });

  return response;
}
