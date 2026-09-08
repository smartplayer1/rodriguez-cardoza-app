'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { ListSkeleton } from '@/components/ui/loading-skeleton';
import { findOrderedMatches, highlightAnyToken } from '@/components/SearchableSelect';

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

  const tokens = useMemo(
    () => search.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [search],
  );

  const filteredClients = useMemo(() => {
    if (tokens.length === 0) {
      return clients.slice(0, 30);
    }

    return clients
      .filter((client) => {
        const haystack = `${client.code} ${client.name}`.toLowerCase();
        return findOrderedMatches(haystack, tokens) !== null;
      })
      .slice(0, 30);
  }, [clients, tokens]);

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
          className="w-full pl-4 pr-16 py-3 bg-input-background border-b-2 border-border
                     focus:border-primary rounded-t transition-colors outline-none"
        />
        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              onSelectClient('');
            }}
            aria-label="Limpiar busqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        ) : (
          <>
            <Search
              size={16}
              className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <ChevronDown
              size={20}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </>
        )}

        {isOpen ? (
          <div className="absolute z-10 mt-1 w-full max-h-64 overflow-auto bg-surface border border-border rounded shadow-lg">
            {loading ? <ListSkeleton count={5} className="p-3" itemClassName="h-10 rounded-xl" /> : null}
            {error ? <p className="px-4 py-2 text-sm text-rose-700">{error}</p> : null}

            {!loading && !error ? (
              filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <button
                    key={client.code}
                    type="button"
                    onClick={() => {
                      onSelectClient(client.code);
                      setSearch(`${client.code} - ${client.name}`);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors ${
                      selectedClientCode === client.code ? 'bg-primary/10 text-primary' : 'text-foreground'
                    }`}
                  >
                    <span className="font-medium">{highlightAnyToken(client.code, tokens)}</span>
                    <span className="ml-2 text-muted-foreground">
                      {highlightAnyToken(client.name, tokens)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-muted-foreground">No se encontraron clientes.</div>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
