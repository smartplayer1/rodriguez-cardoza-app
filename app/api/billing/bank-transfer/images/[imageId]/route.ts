import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return 'Error al eliminar la imagen de la transferencia';
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || 'Error al eliminar la imagen de la transferencia';
};

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { imageId } = await params;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/billing/bank-transfer/images/${imageId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    return NextResponse.json(
      { message: readErrorMessage(errorBody), error: errorBody },
      { status: response.status },
    );
  }

  return new NextResponse(null, { status: 204 });
}
