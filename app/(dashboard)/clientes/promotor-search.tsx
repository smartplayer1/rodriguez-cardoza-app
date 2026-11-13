'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';

import { buildClientsQuery } from '@/app/services/clients';
import { ClienteResponse } from '@/app/type/client';

export type PromotorOption = {
  id: number;
  code: string;
  name: string;
};

type Props = {
  value: PromotorOption | null;
  onChange: (value: PromotorOption | null) => void;
};

const SEARCH_DELAY_MS = 300;
const MAX_RESULTS = 10;

const fetchPromotores = async (filters: { name?: string; code?: string }, signal: AbortSignal) => {
  const query = buildClientsQuery({ ...filters, clientType: 'PROMOTOR', page: 1, perPage: MAX_RESULTS });
  const res = await fetch(`/api/clients?${query.toString()}`, { signal });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  return (data?.records ?? []) as ClienteResponse[];
};

// Buscador de clientes tipo PROMOTOR. La API solo combina filtros con AND,
// así que se buscan por nombre y por código en paralelo y se unen.
export default function PromotorSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PromotorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [byName, byCode] = await Promise.all([
          fetchPromotores({ name: term }, controller.signal),
          fetchPromotores({ code: term }, controller.signal),
        ]);
        const merged = new Map<number, PromotorOption>();
        [...byCode, ...byName].forEach((client) => {
          merged.set(client.id, { id: client.id, code: client.code, name: client.name });
        });
        setResults(Array.from(merged.values()).slice(0, MAX_RESULTS));
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, SEARCH_DELAY_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
        <span className="truncate">
          <span className="font-mono">{value.code}</span> — {value.name}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Quitar promotor"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 focus-within:border-primary">
        <Search size={16} className="text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            // Enter aquí no debe enviar el formulario de filtros.
            if (e.key === 'Enter') e.preventDefault();
          }}
          placeholder="Buscar promotor por nombre o código"
          className="w-full bg-transparent text-sm outline-none"
        />
        {loading && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
      </div>

      {open && query.trim() && !loading && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</li>
          ) : (
            results.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setQuery('');
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  <span className="font-mono">{option.code}</span> — {option.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
