import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();

  cookieStore.delete('token');
  cookieStore.delete('tokenExpiresAt');
  cookieStore.delete('refreshToken');
  cookieStore.delete(
    'refreshTokenExpiresAt'
  );

  return NextResponse.json({
    success: true,
  });
}