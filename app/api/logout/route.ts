import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAMES, buildAuthCookieAttributes } from '@/app/lib/auth/session-cookies';

// NOTA: el backend no expone (todavía) un endpoint para revocar el refresh
// token en el servidor al hacer logout; esto solo limpia la sesión local
// (cookies). Si se agrega un endpoint tipo POST /v1/authentication/logout
// o /revoke, debe llamarse aquí con el refreshToken actual antes de
// borrar las cookies, para que el refresh token no quede utilizable.
export async function POST() {
  const response = NextResponse.json({ success: true });

  // Se borran con exactamente los mismos atributos (Path, SameSite, Secure)
  // con los que se crearon, para que el navegador las reconozca y elimine.
  AUTH_COOKIE_NAMES.forEach((name) => {
    response.cookies.set(name, '', { ...buildAuthCookieAttributes(), maxAge: 0 });
  });

  return response;
}