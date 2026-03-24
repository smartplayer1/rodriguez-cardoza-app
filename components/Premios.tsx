import React from 'react';
import { Award } from 'lucide-react';
import Bonificaciones from './Bonificaciones';
import IncentivosRetencion from './IncentivosRetencion';
import IncentivoRetencionNuevosIngresos from './IncentivoRetencionNuevosIngresos';
import Cupones from './Cupones';

interface PremiosProps {
  activeSubmodule?: string | null;
}

export default function Premios({ activeSubmodule }: PremiosProps) {
  // Show Bonificaciones (tracking)
  if (activeSubmodule === 'bonificaciones') {
    return <Bonificaciones />;
  }

  // Show Cupones
  if (activeSubmodule === 'cupones') {
    return <Cupones />;
  }

  // Show Incentivos de Retención (Acumulación de Producto)
  if (activeSubmodule === 'incentivos-retencion') {
    return <IncentivosRetencion />;
  }

  // Show Incentivo Por Retención de Nuevo Ingreso
  if (activeSubmodule === 'incentivos-retencion-nuevos-ingresos') {
    return <IncentivoRetencionNuevosIngresos />;
  }
  
  // No submodule selected - show empty state
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