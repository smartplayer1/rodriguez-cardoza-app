import React, { useEffect, useMemo, useState } from 'react';
import { Receipt, Save, X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import {
	ServerInvoiceResponse,
	ServerInvoiceUpdateDetailPayload,
	ServerInvoiceUpdateHeaderPayload,
	ServerInvoiceUpdatePayload,
} from '@/app/type/invoice';

interface EditarFacturaProps {
	isOpen: boolean;
	invoice: ServerInvoiceResponse | null;
	onClose: () => void;
	onSave: (payload: ServerInvoiceUpdatePayload) => Promise<void>;
}

type EditableHeader = {
	document: string;
	chargeStatus: string;
	clientCode: string;
	clientName: string;
	warehouse: number;
	branchCode: string;
	cashier: string;
	issuedAt: string;
	store: string;
	promoterCode: string;
	promoterName: string;
	priceLevel: string;
	coupon: number;
};

type EditableDetail = {
	id: number;
	article: string;
	quantity: number;
	salePrice: number;
	price: number;
	tax1: number;
	tax2: number;
	lineDiscount: number;
	generalDiscount: number;
	isExempt: string;
};

const toDateInputValue = (isoDate: string) => {
	if (!isoDate) return '';
	const parsed = new Date(isoDate);
	if (Number.isNaN(parsed.getTime())) return '';
	return parsed.toISOString().split('T')[0];
};

const safeNumber = (value: number | string) => {
	const num = Number(value);
	return Number.isFinite(num) ? num : 0;
};

const hasChanged = (original: unknown, updated: unknown) => {
	if (original === updated) return false;

	if (typeof original === 'number' || typeof updated === 'number') {
		return Number(original) !== Number(updated);
	}

	if (typeof original === 'boolean' || typeof updated === 'boolean') {
		return Boolean(original) !== Boolean(updated);
	}

	return String(original ?? '') !== String(updated ?? '');
};

export default function EditarFactura({ isOpen, invoice, onClose, onSave }: EditarFacturaProps) {
	const [headerForm, setHeaderForm] = useState<EditableHeader | null>(null);
	const [detailsForm, setDetailsForm] = useState<EditableDetail[]>([]);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!invoice || !isOpen) return;

		setHeaderForm({
			document: invoice.header.document || '',
			chargeStatus: invoice.header.chargeStatus || '',
			clientCode: invoice.header.clientCode || '',
			clientName: invoice.header.clientName || '',
			warehouse: safeNumber(invoice.header.warehouse),
			branchCode: invoice.header.branchCode || '',
			cashier: invoice.header.cashier || '',
			issuedAt: toDateInputValue(invoice.header.issuedAt),
			store: invoice.header.store || '',
			promoterCode: invoice.header.promoterCode || '',
			promoterName: invoice.header.promoterName || '',
			priceLevel: invoice.header.priceLevel || '',
			coupon: safeNumber(invoice.header.coupon),
		});

		setDetailsForm(
			invoice.details.map((detail) => ({
				id: detail.id,
				article: detail.article || '',
				quantity: safeNumber(detail.quantity),
				salePrice: safeNumber(detail.salePrice),
				price: safeNumber(detail.price),
				tax1: safeNumber(detail.tax1),
				tax2: safeNumber(detail.tax2),
				lineDiscount: safeNumber(detail.lineDiscount),
				generalDiscount: safeNumber(detail.generalDiscount),
				isExempt: detail.isExempt || '',
			}))
		);
	}, [invoice, isOpen]);

	const computedTotals = useMemo(() => {
		const grossTotal = detailsForm.reduce((acc, detail) => acc + detail.price * detail.quantity, 0);
		const tax1Total = detailsForm.reduce((acc, detail) => acc + detail.tax1, 0);
		const tax2Total = detailsForm.reduce((acc, detail) => acc + detail.tax2, 0);
		const lineDiscountTotal = detailsForm.reduce((acc, detail) => acc + detail.lineDiscount, 0);
		const generalDiscountTotal = detailsForm.reduce((acc, detail) => acc + detail.generalDiscount, 0);
		const netTotal = grossTotal + tax1Total + tax2Total - lineDiscountTotal - generalDiscountTotal;

		return {
			grossTotal,
			tax1Total,
			tax2Total,
			lineDiscountTotal,
			generalDiscountTotal,
			netTotal,
			totalItems: detailsForm.reduce((acc, detail) => acc + detail.quantity, 0),
		};
	}, [detailsForm]);

	if (!isOpen || !invoice || !headerForm) return null;

	const updateHeaderField = <K extends keyof EditableHeader>(key: K, value: EditableHeader[K]) => {
		setHeaderForm((prev) => (prev ? { ...prev, [key]: value } : prev));
	};

	const updateDetailField = <K extends keyof EditableDetail>(
		detailId: number,
		key: K,
		value: EditableDetail[K]
	) => {
		setDetailsForm((prev) =>
			prev.map((detail) =>
				detail.id === detailId
					? {
							...detail,
							[key]: value,
						}
					: detail
			)
		);
	};

	const buildHeaderPayload = (): ServerInvoiceUpdateHeaderPayload => {
		const source = invoice.header;

		return {
			id: source.id,
			cashManagementId: null,
			document: hasChanged(source.document, headerForm.document) ? headerForm.document : null,
			chargeStatus: hasChanged(source.chargeStatus, headerForm.chargeStatus) ? headerForm.chargeStatus : null,
			clientCode: hasChanged(source.clientCode, headerForm.clientCode) ? headerForm.clientCode : null,
			clientName: hasChanged(source.clientName, headerForm.clientName) ? headerForm.clientName : null,
			warehouse: hasChanged(source.warehouse, headerForm.warehouse) ? headerForm.warehouse : null,
			branchCode: hasChanged(source.branchCode, headerForm.branchCode) ? headerForm.branchCode : null,
			cashier: hasChanged(source.cashier, headerForm.cashier) ? headerForm.cashier : null,
			issuedAt: hasChanged(toDateInputValue(source.issuedAt), headerForm.issuedAt)
				? (headerForm.issuedAt ? new Date(headerForm.issuedAt).toISOString() : null)
				: null,
			store: hasChanged(source.store, headerForm.store) ? headerForm.store : null,
			promoterCode: hasChanged(source.promoterCode, headerForm.promoterCode) ? headerForm.promoterCode : null,
			promoterName: hasChanged(source.promoterName, headerForm.promoterName) ? headerForm.promoterName : null,
			priceLevel: hasChanged(source.priceLevel, headerForm.priceLevel) ? headerForm.priceLevel : null,
			coupon: hasChanged(source.coupon, headerForm.coupon) ? headerForm.coupon : null,
			grossTotal: hasChanged(source.grossTotal, computedTotals.grossTotal) ? computedTotals.grossTotal : null,
			lineDiscountTotal: hasChanged(source.lineDiscountTotal, computedTotals.lineDiscountTotal)
				? computedTotals.lineDiscountTotal
				: null,
			generalDiscountTotal: hasChanged(source.generalDiscountTotal, computedTotals.generalDiscountTotal)
				? computedTotals.generalDiscountTotal
				: null,
			tax1Total: hasChanged(source.tax1Total, computedTotals.tax1Total) ? computedTotals.tax1Total : null,
			tax2Total: hasChanged(source.tax2Total, computedTotals.tax2Total) ? computedTotals.tax2Total : null,
			netTotal: hasChanged(source.netTotal, computedTotals.netTotal) ? computedTotals.netTotal : null,
			totalItems: hasChanged(source.totalItems, computedTotals.totalItems) ? computedTotals.totalItems : null,
			currentDetailVersion: null,
			isVoided: null,
		};
	};

	const buildDetailsPayload = (): ServerInvoiceUpdateDetailPayload[] => {
		return detailsForm.map((detailForm) => {
			const source = invoice.details.find((detail) => detail.id === detailForm.id);

			return {
				id: detailForm.id,
				article: hasChanged(source?.article, detailForm.article) ? detailForm.article : null,
				quantity: hasChanged(source?.quantity, detailForm.quantity) ? detailForm.quantity : null,
				salePrice: hasChanged(source?.salePrice, detailForm.salePrice) ? detailForm.salePrice : null,
				price: hasChanged(source?.price, detailForm.price) ? detailForm.price : null,
				tax1: hasChanged(source?.tax1, detailForm.tax1) ? detailForm.tax1 : null,
				tax2: hasChanged(source?.tax2, detailForm.tax2) ? detailForm.tax2 : null,
				lineDiscount: hasChanged(source?.lineDiscount, detailForm.lineDiscount) ? detailForm.lineDiscount : null,
				generalDiscount: hasChanged(source?.generalDiscount, detailForm.generalDiscount)
					? detailForm.generalDiscount
					: null,
				isExempt: hasChanged(source?.isExempt, detailForm.isExempt) ? detailForm.isExempt : null,
			};
		});
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			await onSave({
				header: buildHeaderPayload(),
				details: buildDetailsPayload(),
			});
			onClose();
		} catch (error) {
			console.error('Error al actualizar factura:', error);
			alert((error as Error).message || 'No se pudo actualizar la factura');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />

			<div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-auto bg-surface rounded elevation-3 p-6">
				<div className="flex items-center gap-3 mb-6">
					<Receipt size={28} className="text-primary" />
					<div>
						<h2 className="text-foreground">Editar Factura</h2>
						<p className="text-muted-foreground">Factura #{invoice.header.document}</p>
					</div>
				</div>

				<div className="space-y-6">
					<div>
						<h3 className="text-foreground mb-4">Encabezado</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<MaterialInput
								label="Documento"
								value={headerForm.document}
								onChange={(e) => updateHeaderField('document', e.target.value)}
							/>
							<MaterialInput
								label="Estado de cobro"
								value={headerForm.chargeStatus}
								onChange={(e) => updateHeaderField('chargeStatus', e.target.value)}
							/>
							<MaterialInput
								label="Código cliente"
								value={headerForm.clientCode}
								onChange={(e) => updateHeaderField('clientCode', e.target.value)}
							/>
							<MaterialInput
								label="Nombre cliente"
								value={headerForm.clientName}
								onChange={(e) => updateHeaderField('clientName', e.target.value)}
							/>
							<MaterialInput
								label="Bodega"
								type="number"
								value={headerForm.warehouse}
								onChange={(e) => updateHeaderField('warehouse', safeNumber(e.target.value))}
							/>
							<MaterialInput
								label="Sucursal"
								value={headerForm.branchCode}
								onChange={(e) => updateHeaderField('branchCode', e.target.value)}
							/>
							<MaterialInput
								label="Cajero"
								value={headerForm.cashier}
								onChange={(e) => updateHeaderField('cashier', e.target.value)}
							/>
							<MaterialInput
								label="Fecha de emisión"
								type="date"
								value={headerForm.issuedAt}
								onChange={(e) => updateHeaderField('issuedAt', e.target.value)}
							/>
							<MaterialInput
								label="Tienda"
								value={headerForm.store}
								onChange={(e) => updateHeaderField('store', e.target.value)}
							/>
							<MaterialInput
								label="Código promotor"
								value={headerForm.promoterCode}
								onChange={(e) => updateHeaderField('promoterCode', e.target.value)}
							/>
							<MaterialInput
								label="Nombre promotor"
								value={headerForm.promoterName}
								onChange={(e) => updateHeaderField('promoterName', e.target.value)}
							/>
							<MaterialInput
								label="Nivel de precio"
								value={headerForm.priceLevel}
								onChange={(e) => updateHeaderField('priceLevel', e.target.value)}
							/>
							<MaterialInput
								label="Cupón"
								type="number"
								value={headerForm.coupon}
								onChange={(e) => updateHeaderField('coupon', safeNumber(e.target.value))}
							/>
						</div>
					</div>

					<div>
						<h3 className="text-foreground mb-4">Detalles</h3>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="bg-muted border-b border-border">
									<tr>
										<th className="px-3 py-2 text-left">Artículo</th>
										<th className="px-3 py-2 text-right">Cantidad</th>
										<th className="px-3 py-2 text-right">Precio Venta</th>
										<th className="px-3 py-2 text-right">Precio</th>
										<th className="px-3 py-2 text-right">Impuesto 1</th>
										<th className="px-3 py-2 text-right">Impuesto 2</th>
										<th className="px-3 py-2 text-right">Desc. Línea</th>
										<th className="px-3 py-2 text-right">Desc. General</th>
										<th className="px-3 py-2 text-left">Exento</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{detailsForm.map((detail) => (
										<tr key={detail.id}>
											<td className="px-3 py-2 min-w-[180px]">
												<input
													className="w-full px-2 py-1 bg-input-background border border-border rounded"
													value={detail.article}
													onChange={(e) => updateDetailField(detail.id, 'article', e.target.value)}
												/>
											</td>
											<td className="px-3 py-2 min-w-[90px]">
												<input
													type="number"
													className="w-full px-2 py-1 bg-input-background border border-border rounded text-right"
													value={detail.quantity}
													onChange={(e) => updateDetailField(detail.id, 'quantity', safeNumber(e.target.value))}
												/>
											</td>
											<td className="px-3 py-2 min-w-[110px]">
												<input
													type="number"
													step="0.01"
													className="w-full px-2 py-1 bg-input-background border border-border rounded text-right"
													value={detail.salePrice}
													onChange={(e) => updateDetailField(detail.id, 'salePrice', safeNumber(e.target.value))}
												/>
											</td>
											<td className="px-3 py-2 min-w-[110px]">
												<input
													type="number"
													step="0.01"
													className="w-full px-2 py-1 bg-input-background border border-border rounded text-right"
													value={detail.price}
													onChange={(e) => updateDetailField(detail.id, 'price', safeNumber(e.target.value))}
												/>
											</td>
											<td className="px-3 py-2 min-w-[110px]">
												<input
													type="number"
													step="0.01"
													className="w-full px-2 py-1 bg-input-background border border-border rounded text-right"
													value={detail.tax1}
													onChange={(e) => updateDetailField(detail.id, 'tax1', safeNumber(e.target.value))}
												/>
											</td>
											<td className="px-3 py-2 min-w-[110px]">
												<input
													type="number"
													step="0.01"
													className="w-full px-2 py-1 bg-input-background border border-border rounded text-right"
													value={detail.tax2}
													onChange={(e) => updateDetailField(detail.id, 'tax2', safeNumber(e.target.value))}
												/>
											</td>
											<td className="px-3 py-2 min-w-[110px]">
												<input
													type="number"
													step="0.01"
													className="w-full px-2 py-1 bg-input-background border border-border rounded text-right"
													value={detail.lineDiscount}
													onChange={(e) => updateDetailField(detail.id, 'lineDiscount', safeNumber(e.target.value))}
												/>
											</td>
											<td className="px-3 py-2 min-w-[110px]">
												<input
													type="number"
													step="0.01"
													className="w-full px-2 py-1 bg-input-background border border-border rounded text-right"
													value={detail.generalDiscount}
													onChange={(e) => updateDetailField(detail.id, 'generalDiscount', safeNumber(e.target.value))}
												/>
											</td>
											<td className="px-3 py-2 min-w-[110px]">
												<input
													className="w-full px-2 py-1 bg-input-background border border-border rounded"
													value={detail.isExempt}
													onChange={(e) => updateDetailField(detail.id, 'isExempt', e.target.value)}
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					<div className="bg-primary/5 border border-primary/20 rounded p-4">
						<h3 className="text-foreground mb-2">Totales Recalculados</h3>
						<div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
							<div>
								<span className="text-muted-foreground">Bruto</span>
								<p className="font-mono text-foreground">{computedTotals.grossTotal.toFixed(2)}</p>
							</div>
							<div>
								<span className="text-muted-foreground">Impuesto 1</span>
								<p className="font-mono text-foreground">{computedTotals.tax1Total.toFixed(2)}</p>
							</div>
							<div>
								<span className="text-muted-foreground">Impuesto 2</span>
								<p className="font-mono text-foreground">{computedTotals.tax2Total.toFixed(2)}</p>
							</div>
							<div>
								<span className="text-muted-foreground">Desc. Línea</span>
								<p className="font-mono text-foreground">{computedTotals.lineDiscountTotal.toFixed(2)}</p>
							</div>
							<div>
								<span className="text-muted-foreground">Desc. General</span>
								<p className="font-mono text-foreground">{computedTotals.generalDiscountTotal.toFixed(2)}</p>
							</div>
							<div>
								<span className="text-muted-foreground">Neto</span>
								<p className="font-mono text-primary"><strong>{computedTotals.netTotal.toFixed(2)}</strong></p>
							</div>
						</div>
					</div>
				</div>

				<div className="flex gap-3 mt-8 pt-6 border-t border-border">
					<MaterialButton variant="outlined" color="secondary" startIcon={<X size={16} />} onClick={onClose}>
						Cancelar
					</MaterialButton>
					<MaterialButton
						variant="contained"
						color="primary"
						startIcon={<Save size={16} />}
						onClick={handleSave}
						disabled={saving}
					>
						{saving ? 'Guardando...' : 'Guardar cambios'}
					</MaterialButton>
				</div>
			</div>
		</div>
	);
}
