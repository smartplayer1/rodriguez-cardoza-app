import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAMES,
  RefreshTokenInvalidError,
  buildAuthCookieAttributes,
  decodeJwtPayloadUnsafe,
  isExpiringSoon,
  performRefresh,
} from '@/app/lib/auth/session-cookies';

const NAMEIDENTIFIER_CLAIM =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

export const config = {
  matcher: [
    // Los archivos estáticos de /public (imágenes) no requieren sesión: el
    // optimizador de next/image los pide sin cookies y sin esta exclusión
    // recibiría la redirección a /login en vez de la imagen.
    '/((?!_next/static|_next/image|favicon.ico|api/login|api/logout|api/auth/refresh|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};

const clearAuthCookies = (response: NextResponse) => {
  AUTH_COOKIE_NAMES.forEach((name) => response.cookies.delete(name));
};

const isApiRequest = (pathname: string) => pathname.startsWith('/api/');

// Deshace la sesión: limpia cookies y, si es navegación de página, manda a
// /login. Las peticiones a /api/* NO se redirigen aquí: se dejan pasar sin
// token para que el Route Handler responda su propio 401 y sea el cliente
// (AuthFetchGuard) quien decida qué hacer, evitando una redirección server
// side en medio de un fetch que el navegador no está esperando como página.
const endSession = (request: NextRequest) => {
  if (isApiRequest(request.nextUrl.pathname)) {
    const response = NextResponse.next();
    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.redirect(new URL('/login', request.url));
  clearAuthCookies(response);
  return response;
};

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const tokenExpiresAt = request.cookies.get('tokenExpiresAt')?.value;
  const refreshTokenValue = request.cookies.get('refreshToken')?.value;

  // Con una sesión iniciada no se puede volver al login: se manda al menú
  // principal. Si las cookies resultan inválidas, el flujo normal (refresh
  // fallido / 401) las limpia y devuelve al usuario a /login sin loop.
  if (request.nextUrl.pathname === '/login') {
    if (token && refreshTokenValue) {
      return NextResponse.redirect(new URL('/main-menu', request.url));
    }
    return NextResponse.next();
  }

  if (!token || !refreshTokenValue) {
    // Sin ambas piezas no hay nada que renovar; si tampoco hay token
    // simplemente no hay sesión.
    if (!token && !refreshTokenValue) {
      if (isApiRequest(request.nextUrl.pathname)) return NextResponse.next();
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (!isExpiringSoon(tokenExpiresAt)) {
    return NextResponse.next();
  }

  const decoded = decodeJwtPayloadUnsafe(token);
  const userId = decoded?.[NAMEIDENTIFIER_CLAIM];

  if (typeof userId !== 'string') {
    return NextResponse.next();
  }

  try {
    const refreshed = await performRefresh(refreshTokenValue, userId);

    // Reescribimos el header Cookie de ESTA petición para que, si sigue su
    // curso hacia un Server Component que a su vez llama a un Route Handler
    // propio (patrón usado en las páginas SSR de esta app), ese llamado
    // interno ya viaje con el token nuevo en vez del que se está por vencer.
    const forwardedHeaders = new Headers(request.headers);
    const existingCookieHeader = forwardedHeaders.get('cookie') ?? '';
    const preservedCookies = existingCookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part && !AUTH_COOKIE_NAMES.some((name) => part.startsWith(`${name}=`)));

    const nextCookiePairs = [
      `token=${refreshed.token}`,
      `tokenExpiresAt=${refreshed.tokenExpiresAt}`,
      `refreshToken=${refreshed.refreshToken}`,
      ...(refreshed.refreshTokenExpiresAt
        ? [`refreshTokenExpiresAt=${refreshed.refreshTokenExpiresAt}`]
        : []),
    ];

    forwardedHeaders.set('cookie', [...preservedCookies, ...nextCookiePairs].join('; '));

    const response = NextResponse.next({ request: { headers: forwardedHeaders } });

    response.cookies.set('token', refreshed.token, buildAuthCookieAttributes(refreshed.tokenExpiresAt));
    response.cookies.set(
      'tokenExpiresAt',
      refreshed.tokenExpiresAt,
      buildAuthCookieAttributes(refreshed.tokenExpiresAt),
    );
    response.cookies.set(
      'refreshToken',
      refreshed.refreshToken,
      buildAuthCookieAttributes(refreshed.refreshTokenExpiresAt),
    );
    if (refreshed.refreshTokenExpiresAt) {
      response.cookies.set(
        'refreshTokenExpiresAt',
        refreshed.refreshTokenExpiresAt,
        buildAuthCookieAttributes(refreshed.refreshTokenExpiresAt),
      );
    }

    return response;
  } catch (error) {
    if (error instanceof RefreshTokenInvalidError) {
      return endSession(request);
    }

    // Fallo transitorio (red, backend caído momentáneamente, etc.): no
    // cerramos la sesión del usuario por esto, dejamos pasar la petición
    // con las cookies actuales. Si el access token ya venció de verdad, el
    // backend responderá 401 y el flujo reactivo del cliente reintentará.
    console.error('SESSION MIDDLEWARE: refresh failed transiently', error);
    return NextResponse.next();
  }
}
