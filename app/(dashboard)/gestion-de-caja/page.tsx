import React from 'react';
import { Settings } from 'lucide-react';

export default function GestionCaja() {

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <Settings size={64} className="mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-foreground mb-2">Módulo de Gestión de Caja</h2>
        <p className="text-muted-foreground">
          Seleccione una opción del menú para comenzar
        </p>
      </div>
    </div>
  );
}