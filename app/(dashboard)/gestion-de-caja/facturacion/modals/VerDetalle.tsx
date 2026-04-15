import { Receipt, X } from "lucide-react";
import { MaterialButton } from "@/components/MaterialButton";

// Interfaces
interface FacturaDetalle {
  id: string;
  articuloId: string;
  articuloNombre: string;
  precioVendido: number;
  cantidad: number;
  subtotal: number;
  esBonificacion?: boolean; // NEW: Flag to identify bonification items
}

interface Factura {
  id: string;
  numeroFactura: string;
  cajaId: string;
  cajaNombre: string;
  asesorId: string;
  asesorNombre: string;
  asesorTipo: 'promotor' | 'empleado';
  fecha: string;
  usuarioGenero: string;
  moneda: string;
  tipoPago: 'Contado' | 'Crédito';
  detalles: FacturaDetalle[];
  subtotal: number;
  iva: number;
  total: number;
  createdAt: string;
  bonificacionesAplicadas?: string[]; // NEW: IDs of bonifications applied
}

interface VerDetalleProps {
 editingFactura: Factura;
 isOpen: boolean;
 onClose: () => void;
}

export default function VerDetalle({editingFactura, isOpen, onClose}: VerDetalleProps) {
  if (!isOpen) return null;
    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="bg-surface rounded elevation-3 p-6">
        <div className="flex-1 overflow-auto">
            <div className="max-w-5xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                <Receipt size={32} className="text-primary" />
                <h2 className="text-foreground">Detalle de Factura</h2>
                </div>
                <p className="text-muted-foreground">
                {editingFactura.numeroFactura}
                </p>
            </div>

            {/* Detail View */}
            <div className="bg-surface rounded elevation-2 p-6">
                {/* Información General */}
                <div className="bg-muted/30 rounded p-4 mb-6">
                <h3 className="text-foreground mb-4">Información General</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                    <span className="text-muted-foreground">Caja:</span>
                    <p className="text-foreground">{editingFactura.cajaNombre}</p>
                    </div>
                    <div>
                    <span className="text-muted-foreground">Asesor:</span>
                    <p className="text-foreground">{editingFactura.asesorNombre}</p>
                    </div>
                    <div>
                    <span className="text-muted-foreground">Fecha:</span>
                    <p className="text-foreground">{editingFactura.fecha}</p>
                    </div>
                    <div>
                    <span className="text-muted-foreground">Usuario:</span>
                    <p className="text-foreground">{editingFactura.usuarioGenero}</p>
                    </div>
                    <div>
                    <span className="text-muted-foreground">Moneda:</span>
                    <p className="text-foreground">{editingFactura.moneda}</p>
                    </div>
                    <div>
                    <span className="text-muted-foreground">Tipo Asesor:</span>
                    <p className="text-foreground capitalize">{editingFactura.asesorTipo}</p>
                    </div>
                    <div>
                    <span className="text-muted-foreground">Tipo de Pago:</span>
                    <p className="text-foreground">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                        editingFactura.tipoPago === 'Contado' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                        {editingFactura.tipoPago}
                        </span>
                    </p>
                    </div>
                </div>
                </div>

                {/* Detalles */}
                <div className="mb-6">
                <h3 className="text-foreground mb-4">Detalles</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                        <th className="px-4 py-3 text-left text-sm text-foreground">Artículo</th>
                        <th className="px-4 py-3 text-right text-sm text-foreground">Precio Vendido</th>
                        <th className="px-4 py-3 text-right text-sm text-foreground">Cantidad</th>
                        <th className="px-4 py-3 text-right text-sm text-foreground">Total Línea</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {editingFactura.detalles.map((det) => (
                        <tr key={det.id}>
                            <td className="px-4 py-3 text-sm text-foreground">{det.articuloNombre}</td>
                            <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                            {det.precioVendido.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground text-right">
                            {det.cantidad}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                            {det.subtotal.toFixed(2)}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                </div>

                {/* Totales */}
                <div className="bg-primary/5 border border-primary/20 rounded p-6">
                <h3 className="text-foreground mb-4">Totales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <p className="text-2xl text-foreground font-mono">{editingFactura.subtotal.toFixed(2)}</p>
                    </div>
                    <div>
                    <span className="text-sm text-muted-foreground">IVA (15%)</span>
                    <p className="text-2xl text-foreground font-mono">{editingFactura.iva.toFixed(2)}</p>
                    </div>
                    <div>
                    <span className="text-sm text-muted-foreground">Total</span>
                    <p className="text-2xl text-primary font-mono">
                        <strong>{editingFactura.total.toFixed(2)}</strong>
                    </p>
                    </div>
                </div>
                </div>

                {/* Action Button */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-border">
                <MaterialButton
                    variant="outlined"
                    color="secondary"
                    startIcon={<X size={18} />}
                    onClick={onClose}
                >
                    Cerrar
                </MaterialButton>
                </div>
            </div>
            </div>
        </div>
        </div>
      </div>
      </div>
    );
  }
