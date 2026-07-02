"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Eye, FileSpreadsheet, FileText, Filter, Plus, Search, Trash2, X } from 'lucide-react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import  ImportarNotaCreditoModal  from '@/components/excel-upload-credit-note';
import { createCreditNote, getCreditNotes } from '@/app/services/billing/credit-note';
import { getInvoices } from '@/app/services/invoice';
import { CreditNoteCreatePayload, CreditNoteImportDetail, CreditNoteImportPayload, CreditNoteRecord } from '@/app/type/credit-note';
import { ServerInvoiceResponse } from '@/app/type/invoice';

type DetailRowState = {
  invoiceLineId: string;
  quantity: string;
};

const emptyDetailRow = (): DetailRowState => ({
  invoiceLineId: '',
  quantity: '1',
});

const toIsoDate = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const normalizeComparable = (value: string | null | undefined) => normalizeValue(value).toLowerCase();

const nearlyEqual = (left: number, right: number) => Math.abs(Number(left || 0) - Number(right || 0)) < 0.01;

const matchesInvoiceDetail = (importDetail: CreditNoteImportDetail, invoiceDetail: ServerInvoiceResponse['details'][number]) => {
  if (normalizeComparable(importDetail.article) !== normalizeComparable(invoiceDetail.article)) {
    return false;
  }

  return (
    nearlyEqual(importDetail.salePrice, invoiceDetail.salePrice)
    && nearlyEqual(importDetail.price, invoiceDetail.price)
    && nearlyEqual(importDetail.tax1, invoiceDetail.tax1)
    && nearlyEqual(importDetail.tax2, invoiceDetail.tax2)
    && nearlyEqual(importDetail.lineDiscount, invoiceDetail.lineDiscount)
    && nearlyEqual(importDetail.generalDiscount, invoiceDetail.generalDiscount)
    && (!importDetail.isExempt || normalizeComparable(importDetail.isExempt) === normalizeComparable(invoiceDetail.isExempt))
  );
};

const normalizeValue = (value: unknown) => {
  if (value == null) return '';
  return String(value).trim();
};

const getStatusLabel = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'emitida':
    case 'issued':
      return 'Emitida';
    case 'borrador':
    case 'draft':
      return 'Borrador';
    case 'anulada':
    case 'cancelled':
      return 'Anulada';
    default:
      return status || 'Desconocido';
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'emitida':
    case 'issued':
      return 'bg-green-100 text-green-700';
    case 'borrador':
    case 'draft':
      return 'bg-yellow-100 text-yellow-700';
    case 'anulada':
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function NotasCreditoPage() {
  const [records, setRecords] = useState<CreditNoteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [paging, setPaging] = useState({
    perPage: 10,
    currentPage: 1,
    totalRecords: 0,
    totalPages: 1,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<CreditNoteRecord | null>(null);

  const [number, setNumber] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [invoiceDocument, setInvoiceDocument] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [detailRows, setDetailRows] = useState<DetailRowState[]>([emptyDetailRow()]);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCreditNotes({
        number: searchTerm || undefined,
        status: statusFilter || undefined,
        page,
        perPage,
      });

      setRecords(response.records || []);
      setPaging(response.paging || { perPage, currentPage: page, totalRecords: 0, totalPages: 1 });
    } catch (error) {
      console.error('Error loading credit notes:', error);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecords();
    }, 300);

    return () => clearTimeout(timer);
  }, [loadRecords]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, perPage]);

  const summary = useMemo(() => {
    return records.reduce(
      (acc, record) => {
        acc.total += 1;
        acc.value += Number(record.header.total || 0);
        const status = record.header.status?.toLowerCase();
        if (status === 'emitida' || status === 'issued') acc.issued += 1;
        if (status === 'borrador' || status === 'draft') acc.draft += 1;
        return acc;
      },
      { total: 0, issued: 0, draft: 0, value: 0 },
    );
  }, [records]);

  const resetCreateForm = () => {
    setNumber('');
    setInvoiceId('');
    setInvoiceDocument('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDetailRows([emptyDetailRow()]);
  };

  const openCreate = () => {
    resetCreateForm();
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const addDetailRow = () => {
    setDetailRows((prev) => [...prev, emptyDetailRow()]);
  };

  const updateDetailRow = (index: number, field: keyof DetailRowState, value: string) => {
    setDetailRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const removeDetailRow = (index: number) => {
    setDetailRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const buildPayload = (): CreditNoteCreatePayload | null => {
    if (!number.trim()) {
      alert('El número de la nota es obligatorio');
      return null;
    }

    const details = detailRows
      .map((row) => ({
        invoiceLineId: Number(row.invoiceLineId),
        quantity: Number(row.quantity),
      }))
      .filter((row) => Number.isInteger(row.invoiceLineId) && row.invoiceLineId > 0 && Number.isInteger(row.quantity) && row.quantity > 0);

    if (details.length === 0) {
      alert('Agregue al menos un detalle válido');
      return null;
    }

    return {
      number: number.trim(),
      invoiceId: invoiceId.trim() ? Number(invoiceId) : null,
      invoiceDocument: invoiceDocument.trim() ? invoiceDocument.trim() : null,
      startDate: toIsoDate(startDate) || new Date().toISOString(),
      details,
    };
  };

  const handleCreate = async () => {
    const payload = buildPayload();
    if (!payload) return;

    try {
      setSaving(true);
      await createCreditNote(payload);
      closeCreate();
      await loadRecords();
    } catch (error) {
      console.error('Error creating credit note:', error);
      alert('No se pudo crear la nota de crédito');
    } finally {
      setSaving(false);
    }
  };

  const handleImport = async (creditNotes: CreditNoteImportPayload[]) => {
    try {
      setImporting(true);
      const invoiceCache = new Map<string, ServerInvoiceResponse>();

      const getInvoiceByDocument = async (document: string) => {
        const normalizedDocument = normalizeValue(document);

        if (invoiceCache.has(normalizedDocument)) {
          return invoiceCache.get(normalizedDocument)!;
        }

        const response = await getInvoices({ document: normalizedDocument });
        const invoice = (response.records || []).find(
          (record) => normalizeValue(record.header.document).toLowerCase() === normalizedDocument.toLowerCase(),
        );

        if (!invoice) {
          throw new Error(`No se encontro la factura ${normalizedDocument}`);
        }

        invoiceCache.set(normalizedDocument, invoice);
        return invoice;
      };

      for (const note of creditNotes) {
        const invoice = await getInvoiceByDocument(note.invoiceDocument);
        const availableDetails = [...invoice.details];

        const payload: CreditNoteCreatePayload = {
          number: note.number,
          invoiceId: invoice.header.id,
          invoiceDocument: invoice.header.document,
          startDate: toIsoDate(note.startDate) || new Date().toISOString(),
          details: note.details.map((detail) => {
            if (detail.invoiceLineId) {
              return {
                invoiceLineId: detail.invoiceLineId,
                quantity: Math.abs(Number(detail.quantity) || 0),
              };
            }

            const matchedIndex = availableDetails.findIndex((invoiceDetail) => matchesInvoiceDetail(detail, invoiceDetail));

            if (matchedIndex === -1) {
              throw new Error(
                `No se pudo relacionar el articulo ${detail.article} de la nota ${note.number} con la factura ${invoice.header.document}`,
              );
            }

            const [matchedDetail] = availableDetails.splice(matchedIndex, 1);

            return {
              invoiceLineId: matchedDetail.id,
              quantity: Math.abs(Number(detail.quantity) || 0),
            };
          }),
        };

        await createCreditNote(payload);
      }
      setIsImportOpen(false);
      await loadRecords();
    } catch (error) {
      console.error('Error importing credit notes:', error);
      alert(error instanceof Error ? error.message : 'No se pudo importar el archivo completo');
    } finally {
      setImporting(false);
    }
  };

  const totalPages = paging.totalPages || 1;
  const hasAnyFilter = !!searchTerm || !!statusFilter;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FileText size={32} className="text-primary" />
              <h2 className="text-foreground">Notas de Crédito</h2>
            </div>
            <p className="text-muted-foreground">Listado, creación e importación Excel de notas de crédito.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <MaterialButton variant="outlined" color="secondary" startIcon={<FileSpreadsheet size={18} />} onClick={() => setIsImportOpen(true)}>
              Importar Excel
            </MaterialButton>
          </div>
        </div>

        <div className="bg-surface rounded elevation-2 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="relative lg:col-span-2">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por numero o documento..."
                className="w-full pl-10 pr-4 py-3 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none"
              />
            </div>

            <div className="relative">
              <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-input-background border-b-2 border-border focus:border-primary rounded-t transition-colors outline-none appearance-none"
              >
                <option value="">Todos los estados</option>
                <option value="borrador">Borrador</option>
                <option value="emitida">Emitida</option>
                <option value="anulada">Anulada</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground flex-wrap">
            <div>{loading ? 'Cargando notas...' : `${paging.totalRecords} registro(s) encontrados`}</div>
            {hasAnyFilter && (
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded elevation-2 p-4">
            <p className="text-sm text-muted-foreground">Total notas</p>
            <p className="text-2xl text-foreground">{summary.total}</p>
          </div>
          <div className="bg-surface rounded elevation-2 p-4">
            <p className="text-sm text-muted-foreground">Emitidas</p>
            <p className="text-2xl text-foreground">{summary.issued}</p>
          </div>
          <div className="bg-surface rounded elevation-2 p-4">
            <p className="text-sm text-muted-foreground">Borradores</p>
            <p className="text-2xl text-foreground">{summary.draft}</p>
          </div>
          <div className="bg-surface rounded elevation-2 p-4">
            <p className="text-sm text-muted-foreground">Valor total</p>
            <p className="text-2xl text-foreground">C${summary.value.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-surface rounded elevation-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm">Número</th>
                  <th className="px-6 py-4 text-left text-sm">Factura</th>
                  <th className="px-6 py-4 text-left text-sm">Fecha</th>
                  <th className="px-6 py-4 text-left text-sm">Estado</th>
                  <th className="px-6 py-4 text-right text-sm">Total</th>
                  <th className="px-6 py-4 text-right text-sm">Detalles</th>
                  <th className="px-6 py-4 text-right text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      Cargando...
                    </td>
                  </tr>
                ) : records.length > 0 ? (
                  records.map((record) => (
                    <tr key={record.header.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-sm text-foreground">{record.header.number}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{record.header.invoiceDocument || '-'}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{new Date(record.header.startDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${getStatusBadgeClass(record.header.status)}`}>
                          {getStatusLabel(record.header.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-foreground">C${Number(record.header.total).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-foreground">{record.details.length}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setViewingRecord(record)}
                            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600"
                            title="Ver detalle"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      {hasAnyFilter ? 'No se encontraron notas con los filtros aplicados' : 'No hay notas de crédito registradas'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-border flex-col md:flex-row">
            <div className="text-sm text-muted-foreground">
              Página <span className="font-medium text-foreground">{paging.currentPage}</span> de <span className="font-medium text-foreground">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="h-10 px-4 rounded-lg border border-border flex items-center gap-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="h-10 px-4 rounded-lg border border-border flex items-center gap-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {viewingRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg elevation-4 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-foreground">Nota de Crédito {viewingRecord.header.number}</h3>
                  <p className="text-sm text-muted-foreground">{viewingRecord.header.invoiceDocument || 'Sin documento'}</p>
                </div>
                <button onClick={() => setViewingRecord(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-muted/30 rounded p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Estado</span><span>{getStatusLabel(viewingRecord.header.status)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Fecha</span><span>{new Date(viewingRecord.header.startDate).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Emitida por</span><span>{viewingRecord.header.issuedBy || 'N/D'}</span></div>
                </div>
                <div className="bg-muted/30 rounded p-4 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Caja</span><span>{viewingRecord.header.cashRegisterName || 'N/D'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Codigo caja</span><span>{viewingRecord.header.cashRegisterCode || 'N/D'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span>C${Number(viewingRecord.header.total).toFixed(2)}</span></div>
                </div>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Articulo</th>
                      <th className="px-4 py-3 text-right text-sm">Cantidad</th>
                      <th className="px-4 py-3 text-right text-sm">Precio</th>
                      <th className="px-4 py-3 text-right text-sm">Impuesto 1</th>
                      <th className="px-4 py-3 text-right text-sm">Impuesto 2</th>
                      <th className="px-4 py-3 text-right text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {viewingRecord.details.map((detail) => (
                      <tr key={detail.id}>
                        <td className="px-4 py-3">{detail.article}</td>
                        <td className="px-4 py-3 text-right">{detail.quantity}</td>
                        <td className="px-4 py-3 text-right">C${Number(detail.price).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">C${Number(detail.tax1).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">C${Number(detail.tax2).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">C${Number(detail.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <MaterialButton variant="outlined" color="secondary" onClick={() => setViewingRecord(null)}>
                  Cerrar
                </MaterialButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg elevation-4 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-foreground">Nueva Nota de Crédito</h3>
                  <p className="text-sm text-muted-foreground">Complete la información y agregue los detalles a reversar.</p>
                </div>
                <button onClick={closeCreate} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <MaterialInput label="Número *" value={number} onChange={(e) => setNumber(e.target.value)} fullWidth />
                <MaterialInput label="Fecha de inicio *" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} fullWidth />
                <MaterialInput label="Invoice Id" type="number" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} fullWidth />
                <MaterialInput label="Invoice Document" value={invoiceDocument} onChange={(e) => setInvoiceDocument(e.target.value)} fullWidth />
              </div>

              <div className="bg-surface rounded elevation-2 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-foreground">Detalles</h4>
                  <MaterialButton variant="outlined" color="primary" onClick={addDetailRow}>
                    Agregar detalle
                  </MaterialButton>
                </div>
                <div className="space-y-4">
                  {detailRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                      <MaterialInput label="Invoice Line Id" type="number" value={row.invoiceLineId} onChange={(e) => updateDetailRow(index, 'invoiceLineId', e.target.value)} fullWidth />
                      <MaterialInput label="Cantidad" type="number" value={row.quantity} onChange={(e) => updateDetailRow(index, 'quantity', e.target.value)} fullWidth />
                      <button
                        type="button"
                        onClick={() => removeDetailRow(index)}
                        disabled={detailRows.length === 1}
                        className="h-12 px-3 rounded border border-border text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <MaterialButton variant="outlined" color="secondary" onClick={closeCreate} disabled={saving}>
                  Cancelar
                </MaterialButton>
                <MaterialButton variant="contained" color="primary" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Nota'}
                </MaterialButton>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImportarNotaCreditoModal
        open={isImportOpen} onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
}
