import React, {useState} from 'react';
import { Receipt, Save, X, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';

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

const IVA_RATE = 0.15; // 15%

 const calculateSubtotal = (detalles: FacturaDetalle[]): number => {
    return detalles.reduce((sum, det) => sum + det.subtotal, 0);
  };

  const calculateIVA = (subtotal: number): number => {
    return subtotal * IVA_RATE;
  };

  const calculateTotal = (subtotal: number, iva: number): number => {
    return subtotal + iva;
  };

  const gestionesAbiertas = [
  { id: '1', cajaId: '1', cajaNombre: 'Caja Principal - Sucursal Central' },
  { id: '2', cajaId: '3', cajaNombre: 'Caja Principal - Sucursal León' }
];

const promotoresDisponibles = [
  { id: 'P1', nombre: 'Laura Martínez Hernández', codigo: 'PROM-001', tipo: 'promotor' as const },
  { id: 'P2', nombre: 'Roberto García Sánchez', codigo: 'PROM-002', tipo: 'promotor' as const },
  { id: 'P3', nombre: 'Patricia López Rodríguez', codigo: 'PROM-003', tipo: 'promotor' as const }
];

// Mock data - Monedas disponibles
const monedasDisponibles = ['NIO (Córdoba)', 'USD (Dólar)'];

const articulosDisponibles = [
  { id: 'ART001', nombre: 'Perfume Chanel N°5 - 100ml', precioSugerido: 2500, categoria: 'Perfume' },
  { id: 'ART002', nombre: 'Labial MAC Ruby Woo', precioSugerido: 450, categoria: 'Maquillaje' },
  { id: 'ART003', nombre: 'Crema Facial La Roche-Posay', precioSugerido: 850, categoria: 'Cuidado de la Piel' },
  { id: 'ART004', nombre: 'Base de Maquillaje Estée Lauder', precioSugerido: 1200, categoria: 'Maquillaje' },
  { id: 'ART005', nombre: 'Perfume Dior Sauvage - 60ml', precioSugerido: 1800, categoria: 'Perfume' },
  { id: 'ART006', nombre: 'Sérum Vitamina C The Ordinary', precioSugerido: 320, categoria: 'Cuidado de la Piel' },
  { id: 'ART007', nombre: 'Brocha Set Professional', precioSugerido: 560, categoria: 'Accesorios de Belleza' },
  { id: 'ART008', nombre: 'Máscara de Pestañas Maybelline', precioSugerido: 280, categoria: 'Maquillaje' }
];

export default function CrearFactura() {
      const [formData, setFormData] = useState({
        cajaId: gestionesAbiertas.length > 0 ? gestionesAbiertas[0].cajaId : '',
        asesorId: promotoresDisponibles.length > 0 ? promotoresDisponibles[0].id : '',
        asesorTipo: 'promotor' as 'promotor' | 'empleado',
        fecha: new Date().toISOString().split('T')[0],
        usuarioGenero: 'Admin',
        moneda: 'NIO (Córdoba)',
        tipoPago: 'Contado' as 'Contado' | 'Crédito',
        detalles: [] as FacturaDetalle[]
      });


  const [newDetalle, setNewDetalle] = useState({
    articuloId: articulosDisponibles.length > 0 ? articulosDisponibles[0].id : '',
    precioVendido: articulosDisponibles.length > 0 ? articulosDisponibles[0].precioSugerido : 0,
    cantidad: 1
  });
    const subtotal = calculateSubtotal(formData.detalles);
    const iva = calculateIVA(subtotal);
    const total = calculateTotal(subtotal, iva);

      const handleArticuloChange = (articuloId: string) => {
    const articulo = articulosDisponibles.find(a => a.id === articuloId);
    if (articulo) {
      setNewDetalle({
        ...newDetalle,
        articuloId,
        precioVendido: articulo.precioSugerido
      });
    }
  };

  const addDetalle = () => {
    if (newDetalle.precioVendido <= 0 || newDetalle.cantidad <= 0) {
      alert('El precio y la cantidad deben ser mayores a 0');
      return;
    }

    const articulo = articulosDisponibles.find(a => a.id === newDetalle.articuloId);
    if (!articulo) return;

    const nuevoDetalle: FacturaDetalle = {
      id: Date.now().toString(),
      articuloId: newDetalle.articuloId,
      articuloNombre: articulo.nombre,
      precioVendido: newDetalle.precioVendido,
      cantidad: newDetalle.cantidad,
      subtotal: newDetalle.precioVendido * newDetalle.cantidad
    };

    setFormData({
      ...formData,
      detalles: [...formData.detalles, nuevoDetalle]
    });

    // Reset detalle form
    setNewDetalle({
      articuloId: articulosDisponibles[0].id,
      precioVendido: articulosDisponibles[0].precioSugerido,
      cantidad: 1
    });
  };

  const removeDetalle = (id: string) => {
    setFormData({
      ...formData,
      detalles: formData.detalles.filter(d => d.id !== id)
    });
  };
    const handleCancel = () => {
    // Reset form data    setFormData({ 
  };
  const handleSave = () => {
    // Validation
    if (!formData.cajaId) {
      alert('Por favor seleccione una caja');
      return;
    }

    if (!formData.asesorId) {
      alert('Por favor seleccione un asesor');
      return;
    }

    if (formData.detalles.length === 0) {
      alert('Debe agregar al menos un detalle a la factura');
      return;
    }

  /*  const caja = gestionesAbiertas.find(g => g.cajaId === formData.cajaId);
    const asesor = asesoresDisponibles.find(a => a.id === formData.asesorId);
    
    const subtotal = calculateSubtotal(formData.detalles);
    const iva = calculateIVA(subtotal);
    const total = calculateTotal(subtotal, iva);

    const newFactura: Factura = {
      id: Date.now().toString(),
      numeroFactura: `FACT-${(facturas.length + 1).toString().padStart(3, '0')}`,
      cajaId: formData.cajaId,
      cajaNombre: caja?.cajaNombre || '',
      asesorId: formData.asesorId,
      asesorNombre: asesor?.nombre || '',
      asesorTipo: formData.asesorTipo,
      fecha: formData.fecha,
      usuarioGenero: formData.usuarioGenero,
      moneda: formData.moneda,
      tipoPago: formData.tipoPago,
      detalles: formData.detalles,
      subtotal,
      iva,
      total,
      createdAt: new Date().toISOString().split('T')[0]
    };

   // setFacturas([...facturas, newFactura]);
   // setShowCreateEdit(false);
    setFormData({
      cajaId: gestionesAbiertas.length > 0 ? gestionesAbiertas[0].cajaId : '',
      asesorId: promotoresDisponibles.length > 0 ? promotoresDisponibles[0].id : '',
      asesorTipo: 'promotor',
      fecha: new Date().toISOString().split('T')[0],
      usuarioGenero: 'Admin',
      moneda: 'NIO (Córdoba)',
      tipoPago: 'Contado',
      detalles: []
    });*/
  };

    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Receipt size={32} className="text-primary" />
              <h2 className="text-foreground">Nueva Factura</h2>
            </div>
            <p className="text-muted-foreground">
              Registre una nueva factura de venta
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              {/* Información General */}
              <div>
                <h3 className="text-foreground mb-4">Información General</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Caja Selection */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Caja * (solo cajas abiertas)
                    </label>
                    <div className="relative">
                      <select
                        value={formData.cajaId}
                        onChange={(e) => setFormData({ ...formData, cajaId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {gestionesAbiertas.map(gestion => (
                          <option key={gestion.cajaId} value={gestion.cajaId}>
                            {gestion.cajaNombre}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Promotor Selection - UPDATED: No type selector, only promoters */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Promotor *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.asesorId}
                        onChange={(e) => setFormData({ ...formData, asesorId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {promotoresDisponibles.map(promotor => (
                          <option key={promotor.id} value={promotor.id}>
                            {promotor.nombre} ({promotor.codigo})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Moneda Selection */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Moneda *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.moneda}
                        onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {monedasDisponibles.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Tipo de Pago Selection */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Tipo de Pago *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.tipoPago}
                        onChange={(e) => setFormData({ ...formData, tipoPago: e.target.value as 'Contado' | 'Crédito' })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        <option value="Contado">Contado</option>
                        <option value="Crédito">Crédito</option>
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <MaterialInput
                    label="Fecha *"
                    type="date"
                    fullWidth
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    disabled
                  />

                  <MaterialInput
                    label="Usuario que genera *"
                    type="text"
                    fullWidth
                    value={formData.usuarioGenero}
                    onChange={(e) => setFormData({ ...formData, usuarioGenero: e.target.value })}
                    disabled
                  />
                </div>
              </div>

              {/* Detalles de Factura */}
              <div>
                <h3 className="text-foreground mb-4">Detalles de Factura</h3>
                
                {/* Add detalle controls */}
                <div className="bg-muted/30 rounded p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-foreground mb-2 block">Artículo</label>
                      <select
                        value={newDetalle.articuloId}
                        onChange={(e) => handleArticuloChange(e.target.value)}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      >
                        {articulosDisponibles.map(art => (
                          <option key={art.id} value={art.id}>{art.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-foreground mb-2 block">Precio Vendido</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newDetalle.precioVendido}
                        onChange={(e) => setNewDetalle({ ...newDetalle, precioVendido: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-foreground mb-2 block">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={newDetalle.cantidad}
                        onChange={(e) => setNewDetalle({ ...newDetalle, cantidad: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <MaterialButton
                        variant="contained"
                        color="primary"
                        startIcon={<Plus size={16} />}
                        onClick={addDetalle}
                        fullWidth
                      >
                        Agregar
                      </MaterialButton>
                    </div>
                  </div>
                </div>

                {/* Detalles table */}
                {formData.detalles.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm text-foreground">Artículo</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Precio</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Cantidad</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Subtotal</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {formData.detalles.map((det) => (
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
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => removeDetalle(det.id)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Totales */}
              {formData.detalles.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded p-6">
                  <h3 className="text-foreground mb-4">Resumen de Totales</h3>
                  <div className="grid grid-col {/* Validation Results Modal */}
                        <ValidationModal
                          open={showValidationModal}
                          onOpenChange={setShowValidationModal}
                          data={importData}
                          errors={importErrors}
                        />s-1 md:grid-cols-3 gap-6">
                    <div>
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <p className="text-2xl text-foreground font-mono">{subtotal.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">IVA (15%)</span>
                      <p className="text-2xl text-foreground font-mono">{iva.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Total</span>
                      <p className="text-2xl text-primary font-mono">
                        <strong>{total.toFixed(2)}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-border">
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Save size={18} />}
                onClick={handleSave}
              >
                Guardar Factura
              </MaterialButton>
              <MaterialButton
                variant="outlined"
                color="secondary"
                startIcon={<X size={18} />}
                onClick={handleCancel}
              >
                Cancelar
              </MaterialButton>
            </div>
          </div>
        </div>
      </div>
    );
}
