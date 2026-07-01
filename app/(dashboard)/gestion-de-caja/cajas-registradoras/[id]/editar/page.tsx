import { headers } from 'next/headers';

import { getCashRegisterById } from '@/app/services/cash-management';
import EditCashRegisterForm from './editar-caja-registradora-form';

type PageParams = {
  id: string;
};

export default async function EditCashRegisterPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = await params;
  const requestHeaders = await headers();
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : undefined;

  const cashRegister = await getCashRegisterById(Number.parseInt(id, 10), baseUrl);

  return <EditCashRegisterForm cashRegister={cashRegister} />;
}