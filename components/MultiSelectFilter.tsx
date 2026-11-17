'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export type MultiSelectOption = {
  value: string;
  label: string;
};

type Props = {
  /** Texto cuando no hay nada seleccionado, ej. "Todas las categorías". */
  placeholder: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
};

// Filtro de selección múltiple: botón con resumen + lista con casillas.
// Sin selección = sin filtro (se muestran todos).
export default function MultiSelectFilter({ placeholder, options, selected, onChange, className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const visibleOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? options.filter((option) => option.label.toLowerCase().includes(term)) : options;
  }, [options, search]);

  const toggle = (value: string) => {
    onChange(selectedSet.has(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? options.find((option) => option.value === selected[0])?.label ?? selected[0]
        : `${selected.length} seleccionadas`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex w-full items-center justify-between gap-2 rounded-t border-b-2 bg-input-background py-2 pl-4 pr-3 text-left transition-colors outline-none ${
          open ? 'border-primary' : 'border-border'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate text-sm ${selected.length === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
          {summary}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                onChange([]);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  onChange([]);
                }
              }}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              aria-label="Quitar filtro"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown size={18} className="text-muted-foreground" />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 rounded-xl border border-border bg-surface shadow-lg">
          {options.length > 8 && (
            <div className="relative border-b border-border p-2">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg bg-input-background py-1.5 pl-8 pr-2 text-sm outline-none"
              />
            </div>
          )}

          <ul role="listbox" aria-multiselectable="true" className="max-h-60 overflow-y-auto p-1">
            {visibleOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</li>
            ) : (
              visibleOptions.map((option) => {
                const checked = selectedSet.has(option.value);
                return (
                  <li key={option.value} role="option" aria-selected={checked}>
                    <button
                      type="button"
                      onClick={() => toggle(option.value)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        checked ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                        }`}
                      >
                        {checked && <Check size={12} />}
                      </span>
                      <span className="truncate">{option.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {selected.length > 0 && (
            <div className="flex justify-end border-t border-border p-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-primary hover:underline"
              >
                Limpiar selección
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
