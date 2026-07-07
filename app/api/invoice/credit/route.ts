import { NextResponse } from 'next/server';

import { getValidToken } from '@/app/lib/helper';

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== 'object') {
    return 'Error al consultar facturas de credito';
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || 'Error al consultar facturas de credito';
};

export async function GET(request: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const requestUrl = new URL(request.url);
    const params = new URLSearchParams();

    const document = requestUrl.searchParams.get('document');
    const clientCode = requestUrl.searchParams.get('clientCode');
    const clientName = requestUrl.searchParams.get('clientName');
    const branchCode = requestUrl.searchParams.get('branchCode');
    const issuedAt = requestUrl.searchParams.get('issuedAt');
    const page = requestUrl.searchParams.get('Page') ?? requestUrl.searchParams.get('page');
    const perPage = requestUrl.searchParams.get('PerPage') ?? requestUrl.searchParams.get('perPage');

    if (document?.trim()) params.set('document', document.trim());
    if (clientCode?.trim()) params.set('clientCode', clientCode.trim());
    if (clientName?.trim()) params.set('clientName', clientName.trim());
    if (branchCode?.trim()) params.set('branchCode', branchCode.trim());
    if (issuedAt?.trim()) params.set('issuedAt', issuedAt.trim());
    if (page?.trim()) params.set('Page', page.trim());
    if (perPage?.trim()) params.set('PerPage', perPage.trim());

    const query = params.toString();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/invoice/credit${query ? `?${query}` : ''}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          message: readErrorMessage(responseBody),
          error: responseBody,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('Error fetching credit invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch credit invoices' }, { status: 500 });
  }
}
