'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { History, X } from 'lucide-react';

import HistoricoClienteClient from './HistoricoClienteClient';

type Props = {
  code: string;
  onClose: () => void;
};

// Histórico del cliente en un modal casi a pantalla completa, para tener
// espacio para la lista de facturas y los paneles de detalle lado a lado.
export default function HistoricoClienteModal({ code, onClose }: Props) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/50 p-2 sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Histórico del cliente"
    >
      <div className="flex h-full w-full max-w-[1800px] flex-col overflow-hidden rounded-xl bg-background shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <History size={20} className="text-primary" />
            <h2 className="text-base font-semibold text-foreground">Histórico del cliente</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <HistoricoClienteClient initialCode={code} syncUrl={false} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
