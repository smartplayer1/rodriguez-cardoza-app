import { Settings } from 'lucide-react';

export default function MainMenuPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Bienvenido</h2>
        <p className="text-muted-foreground">
          Seleccione una opcion del menu lateral para comenzar
        </p>
      </div>

      <div className="bg-surface rounded elevation-2 p-6 text-center py-12">
        <Settings size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          Utilice el menu principal para acceder a las diferentes secciones del sistema
        </p>
      </div>
    </div>
  );
}