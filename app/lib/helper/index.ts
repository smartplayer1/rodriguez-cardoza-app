import { cookies } from 'next/headers';
import { isTokenExpired, refreshToken } from '../auth';

export async function getValidToken() {
  const cookieStore = await cookies();

  let token =
    cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  const expired =
    await isTokenExpired();

  if (expired) {
    token = await refreshToken();
  }

  return token;
}