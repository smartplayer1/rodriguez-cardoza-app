import React from 'react';
import { Award } from 'lucide-react';

export default function Premios() {

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <Award size={64} className="mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-foreground mb-2">Módulo de Premios</h2>
        <p className="text-muted-foreground">
          Seleccione una opción del menú para comenzar
        </p>
      </div>
    </div>
  );
}