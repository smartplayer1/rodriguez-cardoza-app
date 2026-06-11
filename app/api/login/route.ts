import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/authentication/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errorData = await res.json();

      return NextResponse.json(
        {
          message:
            errorData.message ||
            'Error al iniciar sesión',
        },
        {
          status: res.status,
        }
      );
    }

    const data = await res.json();

    const response = NextResponse.json(
      {
        success: true,
        tokenExpiresAt: data.tokenExpiresAt,
      },
      {
        status: 200,
      }
    );

    // Access Token
    response.cookies.set('token', data.token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    // Fecha de expiración del token
    response.cookies.set(
      'tokenExpiresAt',
      data.tokenExpiresAt,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      }
    );

    // Solo guardar si existe
    if (data.refreshToken) {
      response.cookies.set(
        'refreshToken',
        data.refreshToken,
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            'production',
          sameSite: 'strict',
          path: '/',
        }
      );
    }

    if (data.refreshTokenExpiresAt) {
      response.cookies.set(
        'refreshTokenExpiresAt',
        data.refreshTokenExpiresAt,
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV ===
            'production',
          sameSite: 'strict',
          path: '/',
        }
      );
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);

    return NextResponse.json(
      {
        message:
          'Ocurrió un error al iniciar sesión',
      },
      {
        status: 500,
      }
    );
  }
}