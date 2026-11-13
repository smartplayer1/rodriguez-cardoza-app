import { History } from 'lucide-react';

import HistoricoClienteClient from './HistoricoClienteClient';

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  ((Array.isArray(value) ? value[0] : value) ?? '').trim();

// Se puede abrir con ?code=CLI001
// (ej. desde el botón "Ver histórico" de la lista de clientes).
export default async function HistoricoClientePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <History size={32} className="text-primary" />
            <h2 className="text-foreground">Histórico del cliente</h2>
          </div>
          <p className="text-muted-foreground">
            Facturas, notas de crédito, cobros, transferencias y artículos de un cliente
          </p>
        </div>

        <HistoricoClienteClient initialCode={first(sp.code)} />
      </div>
    </div>
  );
}
