"use client"

import { useState, useCallback, useRef } from "react"
import * as XLSX from "xlsx"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronDown,
  Filter,
  Upload,
  FileSpreadsheet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ValidationModal, type ValidationError } from "@/components/ValidationModal"

interface Empleado {
  id: string
  codigo: string
  primerNombre: string
  segundoNombre: string
  primerApellido: string
  segundoApellido: string
  telefono: string
  cedula: string
  posicionId: string
  posicionNombre: string
  sucursalId: string
  sucursalNombre: string
  isAdvisor: boolean
  isPromoter: boolean
  createdAt: string
}

const posicionesDisponibles = [
  { id: "1", nombre: "Gerente General" },
  { id: "2", nombre: "Contador" },
  { id: "3", nombre: "Asistente Contable" },
  { id: "4", nombre: "Cajero" },
  { id: "5", nombre: "Auxiliar Administrativo" },
]

const sucursalesDisponibles = [
  { id: "1", nombre: "Sucursal Central Managua" },
  { id: "2", nombre: "Sucursal Leon" },
  { id: "3", nombre: "Sucursal Granada" },
  { id: "4", nombre: "Sucursal Esteli" },
]

const PHONE_REGEX = /^\d{4}-\d{4}$/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateRow(row: any, index: number): ValidationError | null {
  const rowErrors: string[] = []

  const nss = row["NSS"]
  if (!nss || isNaN(Number(nss))) {
    rowErrors.push("NSS es obligatorio y debe ser numerico")
  }

  const nombre = row["Nombre y apellidos"]
  if (!nombre || String(nombre).trim().length < 3) {
    rowErrors.push("Nombre y apellidos es obligatorio (min. 3 caracteres)")
  }

  const cedula = row["Columna1"]
  if (!cedula || String(cedula).trim() === "") {
    rowErrors.push("Cedula (Columna1) es obligatoria")
  }

  const telefono = row["Telefono"]
  const telefonoStr = telefono != null ? String(telefono).trim() : ""
  if (telefonoStr !== "" && !PHONE_REGEX.test(telefonoStr)) {
    rowErrors.push("Telefono debe tener formato ####-####")
  }

  const cargo = row["Cargo"]
  if (!cargo || String(cargo).trim() === "") {
    rowErrors.push("Cargo es obligatorio")
  }

  const rol = row["Rol"]
  if (!rol || String(rol).trim() === "") {
    rowErrors.push("Rol es obligatorio")
  }

  const sucursal = row["sucursal"]
  if (!sucursal || String(sucursal).trim() === "") {
    rowErrors.push("Sucursal es obligatoria")
  }

  return rowErrors.length > 0 ? { fila: index + 2, errores: rowErrors } : null
}

const initialEmpleados: Empleado[] = [
  {
    id: "1",
    codigo: "E001",
    primerNombre: "Carlos",
    segundoNombre: "Alberto",
    primerApellido: "Rodriguez",
    segundoApellido: "Cardoza",
    telefono: "8765-4321",
    cedula: "001-150890-0003M",
    posicionId: "1",
    posicionNombre: "Gerente General",
    sucursalId: "1",
    sucursalNombre: "Sucursal Central Managua",
    isAdvisor: false,
    isPromoter: false,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    codigo: "E002",
    primerNombre: "Maria",
    segundoNombre: "Elena",
    primerApellido: "Gonzalez",
    segundoApellido: "Perez",
    telefono: "8234-5678",
    cedula: "001-220595-0001F",
    posicionId: "2",
    posicionNombre: "Contador",
    sucursalId: "2",
    sucursalNombre: "Sucursal Leon",
    isAdvisor: true,
    isPromoter: false,
    createdAt: "2024-02-10",
  },
  {
    id: "3",
    codigo: "E003",
    primerNombre: "Jose",
    segundoNombre: "Luis",
    primerApellido: "Martinez",
    segundoApellido: "Lopez",
    telefono: "8456-7890",
    cedula: "001-180798-0002M",
    posicionId: "4",
    posicionNombre: "Cajero",
    sucursalId: "3",
    sucursalNombre: "Sucursal Granada",
    isAdvisor: false,
    isPromoter: true,
    createdAt: "2024-03-05",
  },
]

export default function EmpleadosPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>(initialEmpleados)
  const [showCreateEdit, setShowCreateEdit] = useState(false)
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null)
  const [roleFilter, setRoleFilter] = useState<string>("all")

  // Import state
  const [showImportModal, setShowImportModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [importData, setImportData] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<ValidationError[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [importFileName, setImportFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    codigo: "",
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    telefono: "",
    cedula: "",
    posicionId: posicionesDisponibles[0]?.id || "",
    sucursalId: sucursalesDisponibles[0]?.id || "",
    isAdvisor: false,
    isPromoter: false,
  })

  // Import functions
  const processFile = useCallback((file: File) => {
    setImportFileName(file.name)
    const reader = new FileReader()

    reader.onload = (evt) => {
      const rawData = new Uint8Array(evt.target!.result as ArrayBuffer)
      const workbook = XLSX.read(rawData, { type: "array" })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(sheet)

      const validationErrors: ValidationError[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validData: any[] = []

      json.forEach((row, index) => {
        const error = validateRow(row, index)
        if (error) {
          validationErrors.push(error)
        } else {
          validData.push(row)
        }
      })

      setImportErrors(validationErrors)
      setImportData(validData)
      setShowImportModal(false)
      setShowValidationModal(true)
    }

    reader.readAsArrayBuffer(file)
  }, [])

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) processFile(file)
    },
    [processFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // CRUD functions
  const handleCreate = () => {
    setEditingEmpleado(null)
    setFormData({
      codigo: "",
      primerNombre: "",
      segundoNombre: "",
      primerApellido: "",
      segundoApellido: "",
      telefono: "",
      cedula: "",
      posicionId: posicionesDisponibles[0]?.id || "",
      sucursalId: sucursalesDisponibles[0]?.id || "",
      isAdvisor: false,
      isPromoter: false,
    })
    setShowCreateEdit(true)
  }

  const handleEdit = (empleado: Empleado) => {
    setEditingEmpleado(empleado)
    setFormData({
      codigo: empleado.codigo,
      primerNombre: empleado.primerNombre,
      segundoNombre: empleado.segundoNombre,
      primerApellido: empleado.primerApellido,
      segundoApellido: empleado.segundoApellido,
      telefono: empleado.telefono,
      cedula: empleado.cedula,
      posicionId: empleado.posicionId,
      sucursalId: empleado.sucursalId,
      isAdvisor: empleado.isAdvisor,
      isPromoter: empleado.isPromoter,
    })
    setShowCreateEdit(true)
  }

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "")
    if (value.length > 0) {
      if (value.length <= 3) {
        // keep as is
      } else if (value.length <= 9) {
        value = `${value.slice(0, 3)}-${value.slice(3)}`
      } else if (value.length <= 13) {
        value = `${value.slice(0, 3)}-${value.slice(3, 9)}-${value.slice(9)}`
      } else {
        value = `${value.slice(0, 3)}-${value.slice(3, 9)}-${value.slice(9, 13)}${value.slice(13, 14)}`
      }
    }
    setFormData({ ...formData, cedula: value })
  }

  const validateCedula = (cedula: string): boolean => {
    const cedulaRegex = /^\d{3}-\d{6}-\d{4}[A-Z]$/
    return cedulaRegex.test(cedula)
  }

  const handleSave = () => {
    if (!formData.codigo.trim()) return
    if (!formData.primerNombre.trim() || !formData.primerApellido.trim()) return
    if (!formData.cedula.trim() || !validateCedula(formData.cedula)) return

    const posicionSeleccionada = posicionesDisponibles.find(
      (p) => p.id === formData.posicionId
    )
    const sucursalSeleccionada = sucursalesDisponibles.find(
      (s) => s.id === formData.sucursalId
    )

    if (editingEmpleado) {
      setEmpleados(
        empleados.map((e) =>
          e.id === editingEmpleado.id
            ? {
                ...e,
                ...formData,
                posicionNombre: posicionSeleccionada?.nombre || "",
                sucursalNombre: sucursalSeleccionada?.nombre || "",
              }
            : e
        )
      )
    } else {
      const newEmpleado: Empleado = {
        id: Date.now().toString(),
        ...formData,
        posicionNombre: posicionSeleccionada?.nombre || "",
        sucursalNombre: sucursalSeleccionada?.nombre || "",
        createdAt: new Date().toISOString().split("T")[0],
      }
      setEmpleados([...empleados, newEmpleado])
    }

    setShowCreateEdit(false)
    setEditingEmpleado(null)
  }

  const handleDelete = (id: string) => {
    if (confirm("Esta seguro que desea eliminar este empleado?")) {
      setEmpleados(empleados.filter((e) => e.id !== id))
    }
  }

  const filteredEmpleados = empleados.filter((empleado) => {
    if (roleFilter === "all") return true
    if (roleFilter === "advisor") return empleado.isAdvisor && !empleado.isPromoter
    if (roleFilter === "promoter") return empleado.isPromoter && !empleado.isAdvisor
    if (roleFilter === "both") return empleado.isAdvisor && empleado.isPromoter
    if (roleFilter === "none") return !empleado.isAdvisor && !empleado.isPromoter
    return true
  })

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary">
            <Users className="size-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans text-balance">
              Empleados
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Administre los empleados de la empresa
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setImportFileName(null)
              setShowImportModal(true)
            }}
          >
            <Upload className="size-4" />
            Importar Excel
          </Button>
          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="size-4" />
            Nuevo Empleado
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Filtrar por rol:
            </span>
          </div>
          <div className="relative min-w-[200px]">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full h-9 pl-3 pr-10 rounded-md border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring appearance-none"
            >
              <option value="all">Todos los empleados</option>
              <option value="advisor">Solo Asesores</option>
              <option value="promoter">Solo Promotores</option>
              <option value="both">Asesores y Promotores</option>
              <option value="none">Sin roles</option>
            </select>
            <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-chart-1" />
              <span className="text-xs text-muted-foreground">
                Asesores: {empleados.filter((e) => e.isAdvisor).length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-chart-2" />
              <span className="text-xs text-muted-foreground">
                Promotores: {empleados.filter((e) => e.isPromoter).length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2.5 rounded-full bg-chart-5" />
              <span className="text-xs text-muted-foreground">
                Total: {empleados.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredEmpleados.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Codigo
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Nombre Completo
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Cedula
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Telefono
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Posicion
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">
                    Roles
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpleados.map((empleado) => {
                  const nombreCompleto =
                    `${empleado.primerNombre} ${empleado.segundoNombre} ${empleado.primerApellido} ${empleado.segundoApellido}`
                      .replace(/\s+/g, " ")
                      .trim()
                  const iniciales = `${empleado.primerNombre.charAt(0)}${empleado.primerApellido.charAt(0)}`

                  return (
                    <TableRow key={empleado.id} className="group">
                      <TableCell>
                        <span className="font-mono text-sm text-foreground">
                          {empleado.codigo}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                              empleado.isAdvisor && empleado.isPromoter
                                ? "bg-chart-5/15 text-chart-5"
                                : empleado.isAdvisor
                                  ? "bg-chart-1/15 text-chart-1"
                                  : empleado.isPromoter
                                    ? "bg-chart-2/15 text-chart-2"
                                    : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {iniciales}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {nombreCompleto}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">
                          {empleado.cedula}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">
                          {empleado.telefono}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal text-xs">
                          {empleado.posicionNombre}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {empleado.isAdvisor && empleado.isPromoter ? (
                            <Badge
                              variant="outline"
                              className="text-xs font-normal bg-chart-5/10 text-chart-5 border-chart-5/20"
                            >
                              Asesor y Promotor
                            </Badge>
                          ) : (
                            <>
                              {empleado.isAdvisor && (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-normal bg-chart-1/10 text-chart-1 border-chart-1/20"
                                >
                                  Asesor
                                </Badge>
                              )}
                              {empleado.isPromoter && (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-normal bg-chart-2/10 text-chart-2 border-chart-2/20"
                                >
                                  Promotor
                                </Badge>
                              )}
                            </>
                          )}
                          {!empleado.isAdvisor && !empleado.isPromoter && (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 h-8 text-xs"
                            onClick={() => handleEdit(empleado)}
                          >
                            <Edit className="size-3.5" />
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(empleado.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <Users className="size-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No hay empleados registrados
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Comience agregando un nuevo empleado o importando desde Excel
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowImportModal(true)}
            >
              <Upload className="size-4" />
              Importar Excel
            </Button>
            <Button className="gap-2" onClick={handleCreate}>
              <Plus className="size-4" />
              Nuevo Empleado
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showCreateEdit} onOpenChange={setShowCreateEdit}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg">
                  {editingEmpleado ? "Editar Empleado" : "Nuevo Empleado"}
                </DialogTitle>
                <DialogDescription>
                  {editingEmpleado
                    ? "Modifique la informacion del empleado"
                    : "Complete la informacion para registrar un nuevo empleado"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-5 space-y-6">
              {/* Personal Info */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Informacion Personal
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Codigo *</Label>
                    <Input
                      id="codigo"
                      placeholder="Ej: E001"
                      value={formData.codigo}
                      onChange={(e) =>
                        setFormData({ ...formData, codigo: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primerNombre">Primer Nombre *</Label>
                    <Input
                      id="primerNombre"
                      placeholder="Ej: Carlos"
                      value={formData.primerNombre}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primerNombre: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="segundoNombre">Segundo Nombre</Label>
                    <Input
                      id="segundoNombre"
                      placeholder="Ej: Alberto"
                      value={formData.segundoNombre}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          segundoNombre: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primerApellido">Primer Apellido *</Label>
                    <Input
                      id="primerApellido"
                      placeholder="Ej: Rodriguez"
                      value={formData.primerApellido}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primerApellido: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="segundoApellido">Segundo Apellido</Label>
                    <Input
                      id="segundoApellido"
                      placeholder="Ej: Cardoza"
                      value={formData.segundoApellido}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          segundoApellido: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Contact & Identity */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Contacto e Identidad
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Telefono</Label>
                    <Input
                      id="telefono"
                      placeholder="Ej: 8765-4321"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cedula *</Label>
                    <Input
                      id="cedula"
                      placeholder="###-######-####X"
                      value={formData.cedula}
                      onChange={handleCedulaChange}
                      maxLength={17}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Formato: ###-######-####X
                    </p>
                  </div>
                </div>
              </div>

              {/* Work Info */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Informacion Laboral
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Posicion *</Label>
                    <div className="relative">
                      <select
                        value={formData.posicionId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            posicionId: e.target.value,
                          })
                        }
                        className="w-full h-9 pl-3 pr-10 rounded-md border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring appearance-none"
                      >
                        {posicionesDisponibles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sucursal *</Label>
                    <div className="relative">
                      <select
                        value={formData.sucursalId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sucursalId: e.target.value,
                          })
                        }
                        className="w-full h-9 pl-3 pr-10 rounded-md border border-input bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-ring appearance-none"
                      >
                        {sucursalesDisponibles.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Roles Adicionales
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    htmlFor="isAdvisor"
                    className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/40 transition-colors has-[[data-state=checked]]:border-chart-1/40 has-[[data-state=checked]]:bg-chart-1/5"
                  >
                    <Checkbox
                      id="isAdvisor"
                      checked={formData.isAdvisor}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          isAdvisor: checked as boolean,
                        })
                      }
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Es Asesor
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Funciones de asesoramiento
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="isPromoter"
                    className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/40 transition-colors has-[[data-state=checked]]:border-chart-2/40 has-[[data-state=checked]]:bg-chart-2/5"
                  >
                    <Checkbox
                      id="isPromoter"
                      checked={formData.isPromoter}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          isPromoter: checked as boolean,
                        })
                      }
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Es Promotor
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Funciones de promocion
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t border-border shrink-0 flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowCreateEdit(false)}
              className="gap-1.5"
            >
              <X className="size-3.5" />
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gap-1.5">
              <Save className="size-3.5" />
              {editingEmpleado ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Excel Modal */}
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <FileSpreadsheet className="size-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg">
                  Importar Empleados
                </DialogTitle>
                <DialogDescription>
                  Sube un archivo Excel (.xlsx, .xls) con los datos de los
                  empleados a importar.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2">
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  inputRef.current?.click()
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="sr-only"
                aria-label="Seleccionar archivo Excel"
              />

              <div className="flex flex-col items-center gap-3">
                <div
                  className={`flex size-14 items-center justify-center rounded-full transition-all duration-200 ${
                    isDragging
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  }`}
                >
                  <Upload className="size-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {importFileName
                      ? importFileName
                      : "Arrastra tu archivo aqui"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {importFileName
                      ? "Haz clic para cambiar de archivo"
                      : "o haz clic para seleccionar (.xlsx, .xls)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Expected columns info */}
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Columnas esperadas:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "NSS",
                  "Nombre y apellidos",
                  "Columna1",
                  "Telefono",
                  "Cargo",
                  "Rol",
                  "sucursal",
                ].map((col) => (
                  <Badge
                    key={col}
                    variant="outline"
                    className="text-[11px] font-normal"
                  >
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportModal(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Results Modal */}
      <ValidationModal
        open={showValidationModal}
        onOpenChange={setShowValidationModal}
        data={importData}
        errors={importErrors}
      />
    </>
  )
}
