"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  /** Ej: "3 facturas y 2 notas de crédito". */
  label: string;
  /** Cantidad de documentos enviados; solo para estimar la duración. */
  documentCount: number;
}

const MESSAGES = [
  "Enviando documentos al servidor...",
  "Validando facturas y notas de crédito...",
  "Guardando en la base de datos...",
  "Aplicando cambios en las gestiones de caja...",
  "Esto puede tardar unos minutos con archivos grandes...",
];

const formatElapsed = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
};

// El guardado es UNA sola petición (todo o nada), así que el servidor no
// informa avance real. La barra es una estimación: avanza rápido al inicio y
// cada vez más lento, sin llegar nunca al 100% hasta que el servidor responde
// (el overlay se desmonta). El tiempo transcurrido sí es real.
export default function ImportSavingOverlay({ label, documentCount }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // ~0.4 s por documento, mínimo 15 s: a ese tiempo la barra va por ~63%.
  const expectedSeconds = Math.max(15, documentCount * 0.4);
  const progress = Math.min(95, 95 * (1 - Math.exp(-elapsed / expectedSeconds)));
  const message = MESSAGES[Math.floor(elapsed / 6) % MESSAGES.length];

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/90 px-6 backdrop-blur-sm"
    >
      <style>{`
        @keyframes import-saving-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>

      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />

      <div className="text-center">
        <p className="font-semibold text-gray-800">Guardando {label}...</p>
        <p className="mt-1 h-5 text-sm text-gray-600 transition-opacity">{message}</p>
      </div>

      <div className="w-full max-w-md">
        <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
          {/* Brillo que se mueve siempre: muestra que sigue trabajando aunque
              la barra avance lento. */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            style={{ animation: "import-saving-shimmer 1.4s ease-in-out infinite" }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <span>Tiempo transcurrido: {formatElapsed(elapsed)}</span>
          <span>{Math.floor(progress)}% aprox.</span>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Esperá a que el servidor termine. No cierres esta ventana ni recargues la página.
      </p>
    </div>
  );
}
