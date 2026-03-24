import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Wallet, Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp, Lock, Unlock, Search, Filter, User } from 'lucide-react';

interface DenominacionRow {
  id: string;
  moneda: string;
  denominacion: number;
  tipo: 'billete' | 'moneda';
  cantidad: number;
}

interface Gestion {
  id: string;
  cajaId: string;
  cajaNombre: string;
  empleadoResponsableId: string;
  empleadoResponsableNombre: string;
  fechaApertura: string;
  horaApertura: string;
  usuarioApertura: string;
  denominacionesApertura: DenominacionRow[];
  totalApertura: number;
  fechaCierre?: string;
  horaCierre?: string;
  usuarioCierre?: string;
  denominacionesCierre?: DenominacionRow[];
  totalCierre?: number;
  diferencia?: number;
  estado: 'abierta' | 'cerrada';
  createdAt: string;
}

// Mock data - Cajas disponibles
const cajasDisponibles = [
  { id: '1', nombre: 'Caja Principal - Sucursal Central', sucursal: 'Managua' },
  { id: '2', nombre: 'Caja 2 - Sucursal Central', sucursal: 'Managua' },
  { id: '3', nombre: 'Caja Principal - Sucursal León', sucursal: 'León' },
  { id: '4', nombre: 'Caja Principal - Sucursal Granada', sucursal: 'Granada' }
];

// Mock data - Empleados disponibles (from Empleados module)
const empleadosDisponibles = [
  { id: '1', nombre: 'Carlos Alberto Rodríguez Cardoza', codigo: 'E001' },
  { id: '2', nombre: 'María José López García', codigo: 'E002' },
  { id: '3', nombre: 'Ana Patricia Torres Morales', codigo: 'E003' },
  { id: '4', nombre: 'Juan Carlos Pérez Hernández', codigo: 'E004' },
  { id: '5', nombre: 'Roberto Sánchez Martínez', codigo: 'E005' }
];

// Mock data - Monedas disponibles
const monedasDisponibles = ['NIO (Córdoba)', 'USD (Dólar)'];

// Denominaciones comunes
const denominacionesNIO = [0.5, 1, 5, 10, 20, 50, 100, 200, 500, 1000];
const denominacionesUSD = [1, 5, 10, 20, 50, 100];

export default function GestionCaja({ activeSubmodule }: { activeSubmodule: string | null }) {
  // If facturacion submodule is active, return  null to let the parent handle routing
  if (activeSubmodule === 'facturacion') {
    return null;
  }
  
  // If activeSubmodule is defined but not 'gestion-lista', we don't render anything
  if (activeSubmodule && activeSubmodule !== 'gestion-lista') {
    return null;
  }
  const [gestiones, setGestiones] = useState<Gestion[]>([
    {
      id: '1',
      cajaId: '1',
      cajaNombre: 'Caja Principal - Sucursal Central',
      empleadoResponsableId: '2',
      empleadoResponsableNombre: 'María José López García',
      fechaApertura: '2024-12-09',
      horaApertura: '08:00',
      usuarioApertura: 'Admin',
      denominacionesApertura: [
        { id: '1', moneda: 'NIO (Córdoba)', denominacion: 100, tipo: 'billete', cantidad: 10 },
        { id: '2', moneda: 'NIO (Córdoba)', denominacion: 50, tipo: 'billete', cantidad: 20 },
        { id: '3', moneda: 'USD (Dólar)', denominacion: 20, tipo: 'billete', cantidad: 5 }
      ],
      totalApertura: 2100,
      fechaCierre: '2024-12-09',
      horaCierre: '17:00',
      usuarioCierre: 'Admin',
      denominacionesCierre: [
        { id: '1', moneda: 'NIO (Córdoba)', denominacion: 100, tipo: 'billete', cantidad: 15 },
        { id: '2', moneda: 'NIO (Córdoba)', denominacion: 50, tipo: 'billete', cantidad: 25 },
        { id: '3', moneda: 'USD (Dólar)', denominacion: 20, tipo: 'billete', cantidad: 8 }
      ],
      totalCierre: 2915,
      diferencia: 815,
      estado: 'cerrada',
      createdAt: '2024-12-09'
    },
    {
      id: '2',
      cajaId: '2',
      cajaNombre: 'Caja 2 - Sucursal Central',
      empleadoResponsableId: '4',
      empleadoResponsableNombre: 'Juan Carlos Pérez Hernández',
      fechaApertura: '2024-12-08',
      horaApertura: '09:00',
      usuarioApertura: 'Admin',
      denominacionesApertura: [
        { id: '1', moneda: 'NIO (Córdoba)', denominacion: 500, tipo: 'billete', cantidad: 5 },
        { id: '2', moneda: 'NIO (Córdoba)', denominacion: 100, tipo: 'billete', cantidad: 10 },
        { id: '3', moneda: 'NIO (Córdoba)', denominacion: 50, tipo: 'billete', cantidad: 15 }
      ],
      totalApertura: 3250,
      fechaCierre: '2024-12-08',
      horaCierre: '18:30',
      usuarioCierre: 'Admin',
      denominacionesCierre: [
        { id: '1', moneda: 'NIO (Córdoba)', denominacion: 500, tipo: 'billete', cantidad: 4 },
        { id: '2', moneda: 'NIO (Córdoba)', denominacion: 100, tipo: 'billete', cantidad: 12 },
        { id: '3', moneda: 'NIO (Córdoba)', denominacion: 50, tipo: 'billete', cantidad: 18 }
      ],
      totalCierre: 3100,
      diferencia: -150,
      estado: 'cerrada',
      createdAt: '2024-12-08'
    },
    {
      id: '3',
      cajaId: '1',
      cajaNombre: 'Caja Principal - Sucursal Central',
      empleadoResponsableId: '3',
      empleadoResponsableNombre: 'Ana Patricia Torres Morales',
      fechaApertura: '2024-12-10',
      horaApertura: '10:00',
      usuarioApertura: 'Admin',
      denominacionesApertura: [
        { id: '1', moneda: 'NIO (Córdoba)', denominacion: 200, tipo: 'billete', cantidad: 10 },
        { id: '2', moneda: 'NIO (Córdoba)', denominacion: 100, tipo: 'billete', cantidad: 15 },
        { id: '3', moneda: 'USD (Dólar)', denominacion: 50, tipo: 'billete', cantidad: 3 }
      ],
      totalApertura: 3650,
      estado: 'abierta',
      createdAt: '2024-12-10'
    },
    {
      id: '4',
      cajaId: '3',
      cajaNombre: 'Caja Principal - Sucursal León',
      empleadoResponsableId: '5',
      empleadoResponsableNombre: 'Roberto Sánchez Martínez',
      fechaApertura: '2024-12-07',
      horaApertura: '08:30',
      usuarioApertura: 'Admin',
      denominacionesApertura: [
        { id: '1', moneda: 'NIO (Córdoba)', denominacion: 100, tipo: 'billete', cantidad: 20 },
        { id: '2', moneda: 'NIO (Córdoba)', denominacion: 50, tipo: 'billete', cantidad: 30 },
        { id: '3', moneda: 'USD (Dólar)', denominacion: 20, tipo: 'billete', cantidad: 10 }
      ],
      totalApertura: 3700,
      fechaCierre: '2024-12-07',
      horaCierre: '17:30',
      usuarioCierre: 'Admin',
      denominacionesCierre: [
        { id: '1', moneda: 'NIO (Córdoba)', denominacion: 100, tipo: 'billete', cantidad: 22 },
        { id: '2', moneda: 'NIO (Córdoba)', denominacion: 50, tipo: 'billete', cantidad: 32 },
        { id: '3', moneda: 'USD (Dólar)', denominacion: 20, tipo: 'billete', cantidad: 12 }
      ],
      totalCierre: 3840,
      diferencia: 140,
      estado: 'cerrada',
      createdAt: '2024-12-07'
    },
    {
      id: '5',
      cajaId: '4',
      cajaNombre: 'Caja Principal - Sucursal Granada',
      empleadoResponsableId: '1',
      empleadoResponsableNombre: 'Carlos Alberto Rodríguez Cardoza',
      fechaApertura: '2024-12-06',
      horaApertura: '09:15',
      usuarioApertura: 'Admin',
      denominacionesApertura: [
        { id: '1', moneda: 'NIO (Córdoba)', denominacion: 500, tipo: 'billete', cantidad: 4 },
        { id: '2', moneda: 'NIO (Córdoba)', denominacion: 200, tipo: 'billete', cantidad: 5 },
        { id: '3', moneda: 'USD (Dólar)', denominacion: 100, tipo: 'billete', cantidad: 2 }
      ],
      totalApertura: 3200,
      fechaCierre: '2024-12-06',
      horaCierre: '18:00',
      usuarioCierre: 'Admin',
      denominacionesCierre: [
        { id: '1', moneda: 'NIO (Córdoba)', denominacion: 500, tipo: 'billete', cantidad: 3 },
        { id: '2', moneda: 'NIO (Córdoba)', denominacion: 200, tipo: 'billete', cantidad: 6 },
        { id: '3', moneda: 'USD (Dólar)', denominacion: 100, tipo: 'billete', cantidad: 2 }
      ],
      totalCierre: 3100,
      diferencia: -100,
      estado: 'cerrada',
      createdAt: '2024-12-06'
    }
  ]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [showCierre, setShowCierre] = useState(false);
  const [editingGestion, setEditingGestion] = useState<Gestion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todas' | 'abierta' | 'cerrada'>('todas');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState<'fechaApertura' | 'cajaNombre' | 'estado' | 'diferencia'>('fechaApertura');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [formData, setFormData] = useState({
    cajaId: cajasDisponibles.length > 0 ? cajasDisponibles[0].id : '',
    empleadoResponsableId: empleadosDisponibles.length > 0 ? empleadosDisponibles[0].id : '',
    fechaApertura: new Date().toISOString().split('T')[0],
    horaApertura: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    usuarioApertura: 'Admin',
    denominacionesApertura: [] as DenominacionRow[],
    fechaCierre: new Date().toISOString().split('T')[0],
    horaCierre: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    usuarioCierre: 'Admin',
    denominacionesCierre: [] as DenominacionRow[]
  });

  const [newDenomApertura, setNewDenomApertura] = useState({
    moneda: 'NIO (Córdoba)',
    denominacion: 100,
    tipo: 'billete' as 'billete' | 'moneda',
    cantidad: 0
  });

  const [newDenomCierre, setNewDenomCierre] = useState({
    moneda: 'NIO (Córdoba)',
    denominacion: 100,
    tipo: 'billete' as 'billete' | 'moneda',
    cantidad: 0
  });

  const handleCreate = () => {
    // Check if caja already has an open gestión
    const openGestion = gestiones.find(g => g.cajaId === cajasDisponibles[0].id && g.estado === 'abierta');
    if (openGestion) {
      alert('Esta caja ya tiene una gestión abierta. Debe cerrarla antes de abrir una nueva.');
      return;
    }

    setEditingGestion(null);
    setFormData({
      cajaId: cajasDisponibles.length > 0 ? cajasDisponibles[0].id : '',
      empleadoResponsableId: empleadosDisponibles.length > 0 ? empleadosDisponibles[0].id : '',
      fechaApertura: new Date().toISOString().split('T')[0],
      horaApertura: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      usuarioApertura: 'Admin',
      denominacionesApertura: [],
      fechaCierre: new Date().toISOString().split('T')[0],
      horaCierre: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      usuarioCierre: 'Admin',
      denominacionesCierre: []
    });
    setShowCreateEdit(true);
  };

  const handleCerrarGestion = (gestion: Gestion) => {
    if (gestion.estado === 'cerrada') {
      alert('Esta gestión ya está cerrada');
      return;
    }

    setEditingGestion(gestion);
    
    // Pre-populate example rows for closing
    const exampleDenominaciones: DenominacionRow[] = [
      { id: '1', moneda: 'NIO (Córdoba)', denominacion: 50, tipo: 'billete', cantidad: 3 },
      { id: '2', moneda: 'NIO (Córdoba)', denominacion: 20, tipo: 'billete', cantidad: 5 },
      { id: '3', moneda: 'NIO (Córdoba)', denominacion: 10, tipo: 'billete', cantidad: 8 },
      { id: '4', moneda: 'NIO (Córdoba)', denominacion: 1, tipo: 'moneda', cantidad: 10 },
      { id: '5', moneda: 'NIO (Córdoba)', denominacion: 0.5, tipo: 'moneda', cantidad: 12 },
      { id: '6', moneda: 'USD (Dólar)', denominacion: 10, tipo: 'billete', cantidad: 4 },
      { id: '7', moneda: 'USD (Dólar)', denominacion: 1, tipo: 'billete', cantidad: 15 }
    ];

    setFormData({
      ...formData,
      fechaCierre: new Date().toISOString().split('T')[0],
      horaCierre: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      usuarioCierre: 'Admin',
      denominacionesCierre: exampleDenominaciones
    });
    setShowCierre(true);
  };

  const addDenominacionApertura = () => {
    if (newDenomApertura.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const newRow: DenominacionRow = {
      id: Date.now().toString(),
      moneda: newDenomApertura.moneda,
      denominacion: newDenomApertura.denominacion,
      tipo: newDenomApertura.tipo,
      cantidad: newDenomApertura.cantidad
    };

    setFormData({
      ...formData,
      denominacionesApertura: [...formData.denominacionesApertura, newRow]
    });

    setNewDenomApertura({
      moneda: 'NIO (Córdoba)',
      denominacion: 100,
      tipo: 'billete',
      cantidad: 0
    });
  };

  const addDenominacionCierre = () => {
    if (newDenomCierre.cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }

    const newRow: DenominacionRow = {
      id: Date.now().toString(),
      moneda: newDenomCierre.moneda,
      denominacion: newDenomCierre.denominacion,
      tipo: newDenomCierre.tipo,
      cantidad: newDenomCierre.cantidad
    };

    setFormData({
      ...formData,
      denominacionesCierre: [...formData.denominacionesCierre, newRow]
    });

    setNewDenomCierre({
      moneda: 'NIO (Córdoba)',
      denominacion: 100,
      tipo: 'billete',
      cantidad: 0
    });
  };

  const removeDenominacionApertura = (id: string) => {
    setFormData({
      ...formData,
      denominacionesApertura: formData.denominacionesApertura.filter(d => d.id !== id)
    });
  };

  const removeDenominacionCierre = (id: string) => {
    setFormData({
      ...formData,
      denominacionesCierre: formData.denominacionesCierre.filter(d => d.id !== id)
    });
  };

  const calculateTotal = (denominaciones: DenominacionRow[]): number => {
    return denominaciones.reduce((sum, denom) => sum + (denom.denominacion * denom.cantidad), 0);
  };

  const handleSaveApertura = () => {
    // Validation
    if (!formData.cajaId) {
      alert('Por favor seleccione una caja');
      return;
    }

    if (!formData.empleadoResponsableId) {
      alert('Por favor seleccione un empleado responsable');
      return;
    }

    if (!formData.fechaApertura || !formData.horaApertura) {
      alert('Por favor complete la fecha y hora de apertura');
      return;
    }

    if (formData.denominacionesApertura.length === 0) {
      alert('Debe agregar al menos una denominación de apertura');
      return;
    }

    // Check if caja already has an open gestión
    const openGestion = gestiones.find(g => g.cajaId === formData.cajaId && g.estado === 'abierta');
    if (openGestion) {
      alert('Esta caja ya tiene una gestión abierta. Debe cerrarla antes de abrir una nueva.');
      return;
    }

    const cajaSeleccionada = cajasDisponibles.find(c => c.id === formData.cajaId);
    const empleadoSeleccionado = empleadosDisponibles.find(e => e.id === formData.empleadoResponsableId);
    const totalApertura = calculateTotal(formData.denominacionesApertura);

    const newGestion: Gestion = {
      id: Date.now().toString(),
      cajaId: formData.cajaId,
      cajaNombre: cajaSeleccionada?.nombre || '',
      empleadoResponsableId: formData.empleadoResponsableId,
      empleadoResponsableNombre: empleadoSeleccionado?.nombre || '',
      fechaApertura: formData.fechaApertura,
      horaApertura: formData.horaApertura,
      usuarioApertura: formData.usuarioApertura,
      denominacionesApertura: formData.denominacionesApertura,
      totalApertura,
      estado: 'abierta',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setGestiones([...gestiones, newGestion]);
    setShowCreateEdit(false);
    setFormData({
      cajaId: cajasDisponibles.length > 0 ? cajasDisponibles[0].id : '',
      empleadoResponsableId: empleadosDisponibles.length > 0 ? empleadosDisponibles[0].id : '',
      fechaApertura: new Date().toISOString().split('T')[0],
      horaApertura: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      usuarioApertura: 'Admin',
      denominacionesApertura: [],
      fechaCierre: new Date().toISOString().split('T')[0],
      horaCierre: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      usuarioCierre: 'Admin',
      denominacionesCierre: []
    });
  };

  const handleSaveCierre = () => {
    if (!editingGestion) return;

    // Validation
    if (!formData.fechaCierre || !formData.horaCierre) {
      alert('Por favor complete la fecha y hora de cierre');
      return;
    }

    if (formData.denominacionesCierre.length === 0) {
      alert('Debe agregar al menos una denominación de cierre');
      return;
    }

    const totalCierre = calculateTotal(formData.denominacionesCierre);
    const diferencia = totalCierre - editingGestion.totalApertura;

    setGestiones(gestiones.map(g =>
      g.id === editingGestion.id
        ? {
            ...g,
            fechaCierre: formData.fechaCierre,
            horaCierre: formData.horaCierre,
            usuarioCierre: formData.usuarioCierre,
            denominacionesCierre: formData.denominacionesCierre,
            totalCierre,
            diferencia,
            estado: 'cerrada' as const
          }
        : g
    ));

    setShowCierre(false);
    setEditingGestion(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar esta gestión?')) {
      setGestiones(gestiones.filter(g => g.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setShowCierre(false);
    setEditingGestion(null);
  };

  // Filtering and sorting
  const filteredGestiones = gestiones.filter(gestion => {
    const matchesSearch = gestion.cajaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          gestion.empleadoResponsableNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          gestion.usuarioApertura.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'todas' || gestion.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

  const sortedGestiones = [...filteredGestiones].sort((a, b) => {
    let compareA: any = a[sortColumn];
    let compareB: any = b[sortColumn];

    if (sortColumn === 'diferencia') {
      compareA = a.diferencia || 0;
      compareB = b.diferencia || 0;
    }

    if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
    if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedGestiones.length / rowsPerPage);
  const paginatedGestiones = sortedGestiones.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Apertura Form
  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Unlock size={32} className="text-green-600" />
              <h2 className="text-foreground">Apertura de Caja</h2>
            </div>
            <p className="text-muted-foreground">
              Registre la apertura de una nueva gestión de caja
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
                      Caja *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.cajaId}
                        onChange={(e) => setFormData({ ...formData, cajaId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {cajasDisponibles.map(caja => (
                          <option key={caja.id} value={caja.id}>
                            {caja.nombre}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Empleado Responsable Selection */}
                  <div>
                    <label className="text-sm text-foreground mb-2 block">
                      Empleado Responsable *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.empleadoResponsableId}
                        onChange={(e) => setFormData({ ...formData, empleadoResponsableId: e.target.value })}
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                        required
                      >
                        {empleadosDisponibles.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.nombre} ({emp.codigo})
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <MaterialInput
                    label="Usuario del Sistema *"
                    type="text"
                    fullWidth
                    value={formData.usuarioApertura}
                    onChange={(e) => setFormData({ ...formData, usuarioApertura: e.target.value })}
                    disabled
                  />

                  <div></div>

                  <MaterialInput
                    label="Fecha de Apertura *"
                    type="date"
                    fullWidth
                    value={formData.fechaApertura}
                    onChange={(e) => setFormData({ ...formData, fechaApertura: e.target.value })}
                    required
                  />

                  <MaterialInput
                    label="Hora de Apertura *"
                    type="time"
                    fullWidth
                    value={formData.horaApertura}
                    onChange={(e) => setFormData({ ...formData, horaApertura: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Conteo de Dinero - Apertura */}
              <div>
                <h3 className="text-foreground mb-4">Conteo de Dinero - Apertura</h3>
                
                {/* Add denomination controls */}
                <div className="bg-muted/30 rounded p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="text-xs text-foreground mb-2 block">Moneda</label>
                      <select
                        value={newDenomApertura.moneda}
                        onChange={(e) => setNewDenomApertura({ ...newDenomApertura, moneda: e.target.value })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      >
                        {monedasDisponibles.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-foreground mb-2 block">Denominación</label>
                      <select
                        value={newDenomApertura.denominacion}
                        onChange={(e) => setNewDenomApertura({ ...newDenomApertura, denominacion: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      >
                        {(newDenomApertura.moneda.startsWith('NIO') ? denominacionesNIO : denominacionesUSD).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-foreground mb-2 block">Tipo</label>
                      <select
                        value={newDenomApertura.tipo}
                        onChange={(e) => setNewDenomApertura({ ...newDenomApertura, tipo: e.target.value as 'billete' | 'moneda' })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      >
                        <option value="billete">Billete</option>
                        <option value="moneda">Moneda</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-foreground mb-2 block">Cantidad</label>
                      <input
                        type="number"
                        min="0"
                        value={newDenomApertura.cantidad}
                        onChange={(e) => setNewDenomApertura({ ...newDenomApertura, cantidad: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <MaterialButton
                        variant="contained"
                        color="primary"
                        startIcon={<Plus size={16} />}
                        onClick={addDenominacionApertura}
                        fullWidth
                      >
                        Agregar
                      </MaterialButton>
                    </div>
                  </div>
                </div>

                {/* Denominaciones table */}
                {formData.denominacionesApertura.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm text-foreground">Moneda</th>
                          <th className="px-4 py-3 text-left text-sm text-foreground">Denominación</th>
                          <th className="px-4 py-3 text-left text-sm text-foreground">Tipo</th>
                          <th className="px-4 py-3 text-left text-sm text-foreground">Cantidad</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Total</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {formData.denominacionesApertura.map((denom) => (
                          <tr key={denom.id}>
                            <td className="px-4 py-3 text-sm text-foreground">{denom.moneda}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{denom.denominacion}</td>
                            <td className="px-4 py-3 text-sm text-foreground capitalize">{denom.tipo}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{denom.cantidad}</td>
                            <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                              {(denom.denominacion * denom.cantidad).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => removeDenominacionApertura(denom.id)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-primary/5 border-t-2 border-primary">
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-right text-foreground">
                            <strong>Total Apertura:</strong>
                          </td>
                          <td className="px-4 py-3 text-right text-foreground font-mono">
                            <strong>{calculateTotal(formData.denominacionesApertura).toFixed(2)}</strong>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-border">
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Save size={18} />}
                onClick={handleSaveApertura}
              >
                Guardar Apertura
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

  // Cierre Form
  if (showCierre && editingGestion) {
    const totalCierre = calculateTotal(formData.denominacionesCierre);
    const diferencia = totalCierre - editingGestion.totalApertura;

    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Lock size={32} className="text-destructive" />
              <h2 className="text-foreground">Cierre de Caja</h2>
            </div>
            <p className="text-muted-foreground">
              Registre el cierre de la gestión de caja: {editingGestion.cajaNombre}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              {/* Información de Apertura */}
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <h3 className="text-foreground mb-3">Información de Apertura</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Fecha:</span>
                    <p className="text-foreground">{editingGestion.fechaApertura}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hora:</span>
                    <p className="text-foreground">{editingGestion.horaApertura}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Empleado Responsable:</span>
                    <p className="text-foreground">{editingGestion.empleadoResponsableNombre}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Apertura:</span>
                    <p className="text-foreground font-mono">{editingGestion.totalApertura.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Información de Cierre */}
              <div>
                <h3 className="text-foreground mb-4">Información de Cierre</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MaterialInput
                    label="Usuario del Sistema *"
                    type="text"
                    fullWidth
                    value={formData.usuarioCierre}
                    onChange={(e) => setFormData({ ...formData, usuarioCierre: e.target.value })}
                    disabled
                  />

                  <MaterialInput
                    label="Fecha de Cierre *"
                    type="date"
                    fullWidth
                    value={formData.fechaCierre}
                    onChange={(e) => setFormData({ ...formData, fechaCierre: e.target.value })}
                    required
                  />

                  <MaterialInput
                    label="Hora de Cierre *"
                    type="time"
                    fullWidth
                    value={formData.horaCierre}
                    onChange={(e) => setFormData({ ...formData, horaCierre: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Conteo de Dinero - Cierre */}
              <div>
                <h3 className="text-foreground mb-4">Conteo de Dinero - Cierre</h3>
                
                {/* Add denomination controls */}
                <div className="bg-muted/30 rounded p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="text-xs text-foreground mb-2 block">Moneda</label>
                      <select
                        value={newDenomCierre.moneda}
                        onChange={(e) => setNewDenomCierre({ ...newDenomCierre, moneda: e.target.value })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      >
                        {monedasDisponibles.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-foreground mb-2 block">Denominación</label>
                      <select
                        value={newDenomCierre.denominacion}
                        onChange={(e) => setNewDenomCierre({ ...newDenomCierre, denominacion: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      >
                        {(newDenomCierre.moneda.startsWith('NIO') ? denominacionesNIO : denominacionesUSD).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-foreground mb-2 block">Tipo</label>
                      <select
                        value={newDenomCierre.tipo}
                        onChange={(e) => setNewDenomCierre({ ...newDenomCierre, tipo: e.target.value as 'billete' | 'moneda' })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      >
                        <option value="billete">Billete</option>
                        <option value="moneda">Moneda</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-foreground mb-2 block">Cantidad</label>
                      <input
                        type="number"
                        min="0"
                        value={newDenomCierre.cantidad}
                        onChange={(e) => setNewDenomCierre({ ...newDenomCierre, cantidad: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-input-background border-b border-border rounded text-sm"
                      />
                    </div>

                    <div className="flex items-end">
                      <MaterialButton
                        variant="contained"
                        color="primary"
                        startIcon={<Plus size={16} />}
                        onClick={addDenominacionCierre}
                        fullWidth
                      >
                        Agregar
                      </MaterialButton>
                    </div>
                  </div>
                </div>

                {/* Denominaciones table with example rows */}
                {formData.denominacionesCierre.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted border-b border-border">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm text-foreground">Moneda</th>
                          <th className="px-4 py-3 text-left text-sm text-foreground">Denominación</th>
                          <th className="px-4 py-3 text-left text-sm text-foreground">Tipo</th>
                          <th className="px-4 py-3 text-left text-sm text-foreground">Cantidad</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Total</th>
                          <th className="px-4 py-3 text-right text-sm text-foreground">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {formData.denominacionesCierre.map((denom) => (
                          <tr key={denom.id}>
                            <td className="px-4 py-3 text-sm text-foreground">{denom.moneda}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{denom.denominacion}</td>
                            <td className="px-4 py-3 text-sm text-foreground capitalize">{denom.tipo}</td>
                            <td className="px-4 py-3 text-sm text-foreground">{denom.cantidad}</td>
                            <td className="px-4 py-3 text-sm text-foreground text-right font-mono">
                              {(denom.denominacion * denom.cantidad).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => removeDenominacionCierre(denom.id)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-primary/5 border-t-2 border-primary">
                        <tr>
                          <td colSpan={4} className="px-4 py-3 text-right text-foreground">
                            <strong>Total Cierre:</strong>
                          </td>
                          <td className="px-4 py-3 text-right text-foreground font-mono">
                            <strong>{totalCierre.toFixed(2)}</strong>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Comparison Section */}
              {formData.denominacionesCierre.length > 0 && (
                <div className={`rounded p-6 border-2 ${
                  diferencia >= 0 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h3 className="text-foreground mb-4">Resumen de Diferencia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <span className="text-sm text-muted-foreground">Total Apertura</span>
                      <p className="text-2xl text-foreground font-mono">
                        {editingGestion.totalApertura.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Total Cierre</span>
                      <p className="text-2xl text-foreground font-mono">
                        {totalCierre.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Diferencia</span>
                      <p className={`text-2xl font-mono ${
                        diferencia >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {diferencia >= 0 ? '+' : ''}{diferencia.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Estado</span>
                      <p className={`text-lg ${
                        diferencia > 0 ? 'text-green-700' : diferencia < 0 ? 'text-red-700' : 'text-foreground'
                      }`}>
                        {diferencia > 0 ? 'Sobrante' : diferencia < 0 ? 'Faltante' : 'Exacto'}
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
                startIcon={<Lock size={18} />}
                onClick={handleSaveCierre}
              >
                Guardar Cierre
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

  // List View
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Wallet size={32} className="text-primary" />
              <h2 className="text-foreground">Gestión de Caja</h2>
            </div>
            <p className="text-muted-foreground">
              Administre las aperturas y cierres de caja diarios
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Apertura
          </MaterialButton>
        </div>

        {/* Filters and Search */}
        <div className="bg-surface rounded elevation-2 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por caja, empleado o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            {/* Estado Filter */}
            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value as any)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="todas">Todas las gestiones</option>
                <option value="abierta">Abiertas</option>
                <option value="cerrada">Cerradas</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            {/* Rows per page */}
            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Gestiones Table */}
        {paginatedGestiones.length > 0 ? (
          <>
            <div className="bg-surface rounded elevation-2 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('cajaNombre')}
                      >
                        <div className="flex items-center gap-2">
                          Caja
                          {sortColumn === 'cajaNombre' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">
                        Empleado Responsable
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('fechaApertura')}
                      >
                        <div className="flex items-center gap-2">
                          Apertura
                          {sortColumn === 'fechaApertura' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-foreground">Cierre</th>
                      <th 
                        className="px-6 py-4 text-left text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('estado')}
                      >
                        <div className="flex items-center gap-2">
                          Estado
                          {sortColumn === 'estado' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-4 text-right text-sm text-foreground cursor-pointer hover:bg-muted/80"
                        onClick={() => handleSort('diferencia')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Diferencia
                          {sortColumn === 'diferencia' && (
                            sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedGestiones.map((gestion) => (
                      <tr key={gestion.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Wallet size={20} className="text-primary" />
                            </div>
                            <div>
                              <div className="text-foreground">{gestion.cajaNombre}</div>
                              <div className="text-xs text-muted-foreground">Usuario: {gestion.usuarioApertura}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-primary" />
                            <span className="text-foreground">{gestion.empleadoResponsableNombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-foreground">{gestion.fechaApertura}</div>
                          <div className="text-xs text-muted-foreground">{gestion.horaApertura}</div>
                        </td>
                        <td className="px-6 py-4">
                          {gestion.fechaCierre ? (
                            <>
                              <div className="text-foreground">{gestion.fechaCierre}</div>
                              <div className="text-xs text-muted-foreground">{gestion.horaCierre}</div>
                            </>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                            gestion.estado === 'abierta'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {gestion.estado === 'abierta' ? <Unlock size={14} /> : <Lock size={14} />}
                            {gestion.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {gestion.diferencia !== undefined ? (
                            <span className={`font-mono ${
                              gestion.diferencia > 0 
                                ? 'text-green-700' 
                                : gestion.diferencia < 0 
                                  ? 'text-red-700' 
                                  : 'text-foreground'
                            }`}>
                              {gestion.diferencia >= 0 ? '+' : ''}{gestion.diferencia.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            {gestion.estado === 'abierta' && (
                              <MaterialButton
                                variant="text"
                                color="primary"
                                startIcon={<Lock size={16} />}
                                onClick={() => handleCerrarGestion(gestion)}
                              >
                                Cerrar
                              </MaterialButton>
                            )}
                            <MaterialButton
                              variant="text"
                              color="secondary"
                              startIcon={<Trash2 size={16} />}
                              onClick={() => handleDelete(gestion.id)}
                            >
                              Eliminar
                            </MaterialButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, sortedGestiones.length)} de {sortedGestiones.length} gestiones
              </div>
              <div className="flex gap-2">
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </MaterialButton>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </MaterialButton>
              </div>
            </div>
          </>
        ) : (
          // Empty State
          <div className="bg-surface rounded elevation-2 py-16 text-center">
            <Wallet size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay gestiones registradas</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterEstado !== 'todas'
                ? 'No se encontraron gestiones con los filtros aplicados'
                : 'Comience abriendo una nueva gestión de caja'}
            </p>
            {!searchTerm && filterEstado === 'todas' && (
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Plus size={18} />}
                onClick={handleCreate}
              >
                Abrir Primera Gestión
              </MaterialButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
