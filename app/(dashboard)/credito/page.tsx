import { headers } from 'next/headers';

import CreditoClient from './CreditoClient';
import { getInvoices } from '@/app/services/invoice';
import type { ServerInvoiceResponse } from '@/app/type/invoice';

export default async function CreditoPage() {
  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get('cookie') ?? undefined;
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_URL_LOCAL;

  let initialRecords: ServerInvoiceResponse[] = [];
  let initialError: string | null = null;

  try {
    const response = await getInvoices({
      chargeStatus: 'CREDITO',
      page: 1,
      perPage: 500,
      baseUrl,
      cookieHeader,
    });
    initialRecords = response.records || [];
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : 'No se pudieron cargar las facturas de crédito';
  }

  return <CreditoClient initialRecords={initialRecords} initialError={initialError} />;
}
