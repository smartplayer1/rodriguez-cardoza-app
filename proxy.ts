import { NextResponse, NextRequest } from 'next/server';
import { getUserFromToken } from '@/app/lib/api/auth';

const routePermissions: Record<string, string> = {
  '/facturacion': 'ver_facturacion',
  '/cobros': 'ver_cobros',
};

export function proxy(req: NextRequest) {
  const user = getUserFromToken(req);

  // 🔐 No autenticado
  if (!user) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const path = req.nextUrl.pathname;

  // 🔒 Permisos
  const requiredPermission = Object.keys(routePermissions).find(route =>
    path.startsWith(route)
  );

  if (
    requiredPermission &&
    !user.permissions.includes(routePermissions[requiredPermission])
  ) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/facturacion/:path*',
    '/cobros/:path*',
  ],
};