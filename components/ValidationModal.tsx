"use client"

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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  CheckCircle2,
  FileWarning,
  AlertTriangle,
  Download,
} from "lucide-react"
import type { ValidationError } from "@/components/ExcelUpload"
import { useState } from "react"

interface ValidationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  errors: ValidationError[]
}

type Tab = "resumen" | "errores" | "validos"

export function ValidationModal({
  open,
  onOpenChange,
  data,
  errors,
}: ValidationModalProps) {
  const totalRows = data.length + errors.length
  const hasErrors = errors.length > 0
  const hasValidData = data.length > 0
  const [activeTab, setActiveTab] = useState<Tab>("resumen")

  const columns = hasValidData ? Object.keys(data[0]) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl lg:max-w-5xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            {hasErrors ? (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <FileWarning className="size-5 text-destructive" />
              </div>
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-chart-2/10">
                <CheckCircle2 className="size-5 text-chart-2" />
              </div>
            )}
            <div className="space-y-0.5">
              <DialogTitle className="text-lg">
                Resultado de Validacion
              </DialogTitle>
              <DialogDescription>
                Se procesaron{" "}
                <span className="font-medium text-foreground">
                  {totalRows}
                </span>{" "}
                filas del archivo Excel.
              </DialogDescription>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-2 pt-3">
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground"
            >
              {totalRows} total
            </Badge>
            {hasValidData && (
              <Badge
                variant="secondary"
                className="bg-chart-2/10 text-chart-2 border-chart-2/20"
              >
                <CheckCircle2 className="size-3 mr-1" />
                {data.length} validos
              </Badge>
            )}
            {hasErrors && (
              <Badge
                variant="secondary"
                className="bg-destructive/10 text-destructive border-destructive/20"
              >
                <AlertCircle className="size-3 mr-1" />
                {errors.length} con errores
              </Badge>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 pt-3 -mb-4 pb-0">
            <TabButton
              active={activeTab === "resumen"}
              onClick={() => setActiveTab("resumen")}
            >
              Resumen
            </TabButton>
            {hasErrors && (
              <TabButton
                active={activeTab === "errores"}
                onClick={() => setActiveTab("errores")}
                count={errors.length}
                variant="error"
              >
                Errores
              </TabButton>
            )}
            {hasValidData && (
              <TabButton
                active={activeTab === "validos"}
                onClick={() => setActiveTab("validos")}
                count={data.length}
                variant="success"
              >
                Datos Validos
              </TabButton>
            )}
          </div>
        </DialogHeader>

        {/* Body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5">
            {/* Resumen Tab */}
            {activeTab === "resumen" && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <SummaryCard
                    label="Total de filas"
                    value={totalRows}
                    icon={<FileWarning className="size-4" />}
                    color="muted"
                  />
                  <SummaryCard
                    label="Filas validas"
                    value={data.length}
                    icon={<CheckCircle2 className="size-4" />}
                    color="success"
                  />
                  <SummaryCard
                    label="Filas con errores"
                    value={errors.length}
                    icon={<AlertCircle className="size-4" />}
                    color="error"
                  />
                </div>

                {/* Quick preview of errors */}
                {hasErrors && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="size-4 text-destructive" />
                      <p className="text-sm font-medium text-destructive">
                        Se encontraron errores de validacion
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {errors.length} fila{errors.length !== 1 && "s"} no
                      cumpl{errors.length === 1 ? "e" : "en"} con las reglas
                      de validacion. Revisa la pestana de errores para ver los
                      detalles.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setActiveTab("errores")}
                    >
                      Ver errores
                    </Button>
                  </div>
                )}

                {!hasErrors && hasValidData && (
                  <div className="rounded-lg border border-chart-2/20 bg-chart-2/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="size-4 text-chart-2" />
                      <p className="text-sm font-medium text-chart-2">
                        Todas las filas son validas
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Los {data.length} registros pasaron todas las
                      validaciones correctamente.
                    </p>
                  </div>
                )}

                {/* Columns found */}
                {columns.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Columnas detectadas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {columns.map((col) => (
                        <Badge
                          key={col}
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {col}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Errores Tab */}
            {activeTab === "errores" && hasErrors && (
              <div className="space-y-2">
                {errors.map((err, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Badge
                        variant="destructive"
                        className="shrink-0 mt-0.5 text-[11px] tabular-nums"
                      >
                        Fila {err.fila}
                      </Badge>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {err.errores.map((e, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-2"
                          >
                            <span className="size-1.5 shrink-0 rounded-full bg-destructive mt-1.5" />
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Datos validos Tab */}
            {activeTab === "validos" && hasValidData && (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10">
                          #
                        </TableHead>
                        {columns.map((key) => (
                          <TableHead
                            key={key}
                            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                          >
                            {key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((row, i) => (
                        <TableRow key={i} className="group">
                          <TableCell className="text-xs text-muted-foreground tabular-nums">
                            {i + 1}
                          </TableCell>
                          {columns.map((col) => (
                            <TableCell
                              key={col}
                              className="text-sm whitespace-nowrap"
                            >
                              {col === "Rol" || col === "sucursal" ? (
                                <Badge
                                  variant="outline"
                                  className="font-normal text-xs"
                                >
                                  {String(row[col] ?? "")}
                                </Badge>
                              ) : (
                                String(row[col] ?? "")
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!hasErrors && !hasValidData && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileWarning className="size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No se encontraron datos en el archivo.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border shrink-0 flex-row gap-2 sm:justify-between">
          <p className="text-xs text-muted-foreground hidden sm:block self-center">
            {hasErrors
              ? `${errors.length} fila${errors.length !== 1 ? "s" : ""} requiere${errors.length === 1 ? "" : "n"} correccion`
              : `${data.length} registro${data.length !== 1 ? "s" : ""} listo${data.length !== 1 ? "s" : ""}`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            {hasValidData && (
              <Button
                onClick={() => onOpenChange(false)}
                className="gap-1.5"
              >
                <Download className="size-3.5" />
                Confirmar datos
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TabButton({
  active,
  onClick,
  children,
  count,
  variant,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  count?: number
  variant?: "error" | "success"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      <span className="flex items-center gap-1.5">
        {children}
        {count !== undefined && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
              variant === "error"
                ? "bg-destructive/10 text-destructive"
                : variant === "success"
                  ? "bg-chart-2/10 text-chart-2"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {count}
          </span>
        )}
      </span>
    </button>
  )
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: "muted" | "success" | "error"
}) {
  const colorClasses = {
    muted: "bg-muted/50 text-muted-foreground",
    success: "bg-chart-2/10 text-chart-2",
    error: "bg-destructive/10 text-destructive",
  }

  return (
    <div className="rounded-lg border border-border p-4 flex items-center gap-3">
      <div
        className={`flex size-9 items-center justify-center rounded-lg ${colorClasses[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
