import React from 'react';
import { Award } from 'lucide-react';
import ReglasBonificacion from './ReglasBonificacion';
import Bonificaciones from './Bonificaciones';

interface BonificacionProps {
  activeSubmodule?: string | null;
}

export default function Bonificacion({ activeSubmodule }: BonificacionProps) {
  // Show Reglas de Bonificación
  if (activeSubmodule === 'reglas-bonificacion') {
    return <ReglasBonificacion />;
  }
  
  // Show Bonificaciones (tracking)
  if (activeSubmodule === 'bonificaciones') {
    return <Bonificaciones />;
  }
  
  // No submodule selected - show empty state
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center">
        <Award size={64} className="mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-foreground mb-2">Módulo de Bonificación</h2>
        <p className="text-muted-foreground">
          Seleccione una opción del menú para comenzar
        </p>
      </div>
    </div>
  );
}
