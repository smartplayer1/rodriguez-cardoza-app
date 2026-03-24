"use client"

import { useCallback, useRef, useState } from "react"
import * as XLSX from "xlsx"
import { Upload, FileSpreadsheet, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ValidationModal } from "@/components/ValidationModal"

export interface ValidationError {
  fila: number
  errores: string[]
}

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

  return rowErrors.length > 0
    ? { fila: index + 2, errores: rowErrors }
    : null
}

export function ExcelUpload() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any[]>([])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback((file: File) => {
    setFileName(file.name)
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

      setErrors(validationErrors)
      setData(validData)
      setIsOpen(true)
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

  const clearFile = useCallback(() => {
    setFileName(null)
    setData([])
    setErrors([])
    if (inputRef.current) inputRef.current.value = ""
  }, [])

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary">
              <FileSpreadsheet className="size-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
              Validador de Excel
            </h1>
            <p className="text-sm text-muted-foreground text-balance leading-relaxed">
              Sube tu archivo Excel para validar los datos de empleados.
              Se verifican NSS, Nombre, Cedula, Telefono, Cargo, Rol y Sucursal.
            </p>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
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
                  {fileName ? fileName : "Arrastra tu archivo aqui"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {fileName
                    ? "Haz clic para cambiar de archivo"
                    : "o haz clic para seleccionar (.xlsx, .xls)"}
                </p>
              </div>
            </div>
          </div>

          {fileName && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(true)}
              >
                Ver resultados
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearFile}
                aria-label="Limpiar archivo"
              >
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <ValidationModal
        open={isOpen}
        onOpenChange={setIsOpen}
        data={data}
        errors={errors}
      />
    </>
  )
}
