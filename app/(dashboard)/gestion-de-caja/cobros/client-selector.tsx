'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ListSkeleton } from '@/components/ui/loading-skeleton';

export type ClientSearchItem = {
  code: string;
  name: string;
};

type ClientSelectorProps = {
  clients: ClientSearchItem[];
  loading: boolean;
  error: string | null;
  selectedClientCode: string;
  onSelectClient: (clientCode: string) => void;
};

export default function ClientSelector({
  clients,
  loading,
  error,
  selectedClientCode,
  onSelectClient,
}: ClientSelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredClients = useMemo(() => {
    if (!normalizedSearch) {
      return clients.slice(0, 30);
    }

    return clients
      .filter((client) => {
        const code = client.code.toLowerCase();
        const name = client.name.toLowerCase();
        return code.includes(normalizedSearch) || name.includes(normalizedSearch);
      })
      .slice(0, 30);
  }, [clients, normalizedSearch]);

  const selectedClient = clients.find((client) => client.code === selectedClientCode) || null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <section ref={containerRef} className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-foreground">Cliente</h4>
        {selectedClient ? (
          <button
            type="button"
            onClick={() => {
              onSelectClient('');
              setSearch('');
              setIsOpen(true);
            }}
            className="rounded-xl border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/20"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder="Buscar cliente por codigo o nombre..."
          className="block w-full rounded-full border border-border bg-background py-3 pl-11 pr-10 text-sm text-foreground shadow-sm outline-none transition-shadow focus:border-primary focus:shadow-md"
        />
        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onSelectClient('');
            }}
            aria-label="Limpiar busqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted/20"
          >
            <X className="size-4" />
          </button>
        ) : null}

        {isOpen ? (
          <div className="absolute inset-x-0 top-full z-20 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-border/60 bg-background shadow-lg">
            {loading ? <ListSkeleton count={5} className="p-3" itemClassName="h-10 rounded-xl" /> : null}
            {error ? <p className="px-3 py-3 text-sm text-rose-700">{error}</p> : null}

            {!loading && !error ? (
              filteredClients.length > 0 ? (
                <div className="divide-y divide-border/40">
                  {filteredClients.map((client) => (
                    <button
                      key={client.code}
                      type="button"
                      onClick={() => {
                        onSelectClient(client.code);
                        setSearch(`${client.code} - ${client.name}`);
                        setIsOpen(false);
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/20 ${
                        selectedClientCode === client.code ? 'bg-primary/5 text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      <span className="font-medium text-foreground">{client.code}</span>
                      <span className="ml-2">{client.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-3 py-3 text-sm text-muted-foreground">No se encontraron clientes.</p>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
