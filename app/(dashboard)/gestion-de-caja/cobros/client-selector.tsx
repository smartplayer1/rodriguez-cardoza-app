'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
    <section ref={containerRef} className="rounded-3xl border border-border/60 bg-background/50 p-4">
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

      <label className="mt-3 block space-y-2">
        <span className="text-xs text-muted-foreground">Buscar por codigo o nombre</span>
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
          placeholder="Ej: C0001 o Maria"
          className="block w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
      </label>

      {isOpen ? (
        <div className="mt-3 h-64 overflow-y-auto rounded-2xl border border-border/60 bg-background">
          {loading ? <p className="px-3 py-3 text-sm text-muted-foreground">Cargando clientes...</p> : null}
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

    </section>
  );
}
