'use client';

import Link from 'next/link';

import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';

export default function EditarCajaLink({ id }: { id: number }) {
  const { can } = useUserStore();

  if (!can(PERMISSIONS.CASH_REGISTER_EDIT)) {
    return null;
  }

  return (
    <Link
      href={`/gestion-de-caja/cajas-registradoras/${id}/editar`}
      className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-accent"
    >
      Editar
    </Link>
  );
}
