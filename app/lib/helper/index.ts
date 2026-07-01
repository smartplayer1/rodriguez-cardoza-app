import { cookies, headers } from 'next/headers';
import { isTokenExpired, refreshToken } from '../auth';

export async function getValidToken() {
  try {
    const headerStore = await headers();
    const authorization = headerStore.get('authorization');

    if (authorization?.toLowerCase().startsWith('bearer ')) {
      const bearerToken = authorization.slice(7).trim();
      if (bearerToken) {
        return bearerToken;
      }
    }

    const cookieStore = await cookies();

    let token = cookieStore.get('token')?.value;

    if (!token) {
      const rawCookie = headerStore.get('cookie') ?? '';
      const tokenFromHeader = rawCookie
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('token='))
        ?.slice('token='.length);

      if (tokenFromHeader) {
        return tokenFromHeader;
      }

      return null;
    }

    const expired = await isTokenExpired();

    if (expired) {
      token = await refreshToken();
    }

    return token ?? null;
  } catch {
    return null;
  }
}