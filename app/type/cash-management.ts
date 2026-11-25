import type { CollectionRecord } from "@/app/type/collection";
import type { BankTransferApplication } from "@/app/type/bank-transfer";

export type CashManagementDenomination = {
  currency: string;
  denomination: number;
  quantity: number;
  total: number;
};

export type CashManagementCreateDenomination = {
  currency: string;
  denomination: number;
  quantity: number;
};

// El backend no recibe tasa: usa el tipo de cambio vigente registrado en Configuración de Moneda.
export type CashManagementCreatePayload = {
  cashRegisterId: number;
  responsibleEmployeeId: number;
  observation: string | null;
  denominations: CashManagementCreateDenomination[];
};

export type CashManagementClosePayload = {
  observation: string | null;
  denominations: CashManagementCreateDenomination[];
};

export type CashManagementReopenPayload = {
  observation: string | null;
};

export type CashManagementBalance = {
  cashManagementId: number;
  nio: number;
  usd: number;
};

export type CashManagementRecord = {
  id: number;
  cashRegisterId: number;
  cashRegisterCode: string;
  cashRegisterName: string;
  responsibleEmployeeId: number;
  responsibleEmployeeName: string;
  openedByUserId: string;
  openedByUserName: string;
  branchId: number;
  branchName: string;
  branchCode: string;
  openedAt: string;
  closedByUserId: string | null;
  closedByUserName: string | null;
  closedAt: string | null;
  exchangeRateNioPerUsd: number;
  status: string;
  openingObservation: string;
  closingObservation: string;
  balance: CashManagementBalance;
  expectedNioAtClose: number;
  expectedUsdAtClose: number;
  actualNioAtClose: number;
  actualUsdAtClose: number;
  differenceNioAtClose: number;
  differenceUsdAtClose: number;
  openingDenominations: CashManagementDenomination[];
  closingDenominations: CashManagementDenomination[];
};

export type CashManagementPaging = {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
};

export type CashManagementResponse = {
  records: CashManagementRecord[];
  paging: CashManagementPaging;
};

export type CashManagementConversionAllocation = {
  collectionId: number;
  usdAmount: number;
  appliedAmountNio: number;
};

export type CashManagementConversionRecord = {
  id: number;
  cashManagementId: number;
  direction: string;
  exchangeRateNioPerUsd: number;
  sourceTotal: number;
  targetTotal: number;
  theoreticalTargetTotal: number;
  exchangeDifference: number;
  convertedAt: string;
  status: string;
  observation: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  sourceDenominations: CashManagementDenomination[];
  targetDenominations: CashManagementDenomination[];
  allocations: CashManagementConversionAllocation[];
};

export type CashManagementConversionResponse = {
  records: CashManagementConversionRecord[];
  paging: CashManagementPaging;
};

export type CashManagementConversionCreateAllocation = {
  collectionId: number;
  usdAmount: number;
};

export type CashManagementConversionCreatePayload = {
  cashManagementId: number;
  direction: 'USD_TO_NIO' | 'NIO_TO_USD';
  observation: string | null;
  sourceDenominations: CashManagementCreateDenomination[];
  targetDenominations: CashManagementCreateDenomination[];
};

export type CashCurrency = "NIO" | "USD";

// Fila del desglose al crear un ingreso/egreso: todas con la misma moneda
// que el registro, cantidad > 0 y sin repetir denominación.
export type CashMovementDenominationInput = {
  currency: CashCurrency;
  denomination: number;
  quantity: number;
};

// Campos comunes de POST .../inflow y POST .../outflow.
type CashMovementCreatePayloadBase = {
  cashManagementId: number;
  number: string;
  occurredAt: string; // ISO UTC (con Z), entre la apertura de la gestión y ahora
  currency: CashCurrency;
  amount: number; // en la moneda de `currency`
  accountingConceptId?: number | null;
  concept: string | null; // null cuando se manda accountingConceptId
  description: string | null;
  denominations?: CashMovementDenominationInput[]; // opcional; debe sumar `amount`
};

export type CashManagementInflowCreatePayload = CashMovementCreatePayloadBase;

export type CashManagementOutflowCreatePayload = CashMovementCreatePayloadBase & {
  creditNoteId: number | null; // si se envía, el egreso debe ser en NIO
};

// PUT .../inflow/{id} y PUT .../outflow/{id}: REEMPLAZA todo el registro.
// Siempre enviar el formulario completo; sin `denominations` (o vacío) el
// desglose anterior se borra. No cambia número, gestión ni nota de crédito.
export type UpdateCashEntryPayload = {
  occurredAt: string; // ISO UTC, dentro del período de la gestión abierta
  accountingConceptId: number | null;
  concept: string | null; // texto libre solo si no hay concepto del catálogo
  description: string | null;
  currency: CashCurrency;
  amount: number;
  denominations: CashMovementDenominationInput[];
};

// Respuesta de ingreso/egreso (201 al crear, 200 en GET).
type CashMovementRecordBase = {
  id: number;
  cashManagementId: number;
  number: string;
  occurredAt: string;
  currency: CashCurrency | string;
  total: number; // en la moneda de `currency`
  concept: string;
  accountingConceptId: number | null;
  accountingConceptName: string | null;
  description: string | null;
  status: string;
  voidedAt: string | null;
  voidedBy: string | null;
  exchangeRateNioPerUsd?: number;
  amountNio?: number;
  denominations: CashManagementDenomination[];
};

export type CashManagementInflowRecord = CashMovementRecordBase;

export type CashManagementOutflowRecord = CashMovementRecordBase & {
  creditNoteId: number | null;
};

export type CashManagementInflowResponse = {
  records: CashManagementInflowRecord[];
  paging: CashManagementPaging;
};

export type CashManagementOutflowResponse = {
  records: CashManagementOutflowRecord[];
  paging: CashManagementPaging;
};

// GET /v1/billing/cash-management/ledger: ingresos y egresos juntos.
// En los egresos `amount` viene en negativo. No sumar montos de monedas distintas.
export type CashLedgerType = "Ingreso" | "Egreso";

export type CashLedgerEntry = {
  id: number;
  sourceType: "CashInflow" | "CashOutflow" | string;
  occurredAt: string;
  type: CashLedgerType | string;
  concept: string;
  description: string | null;
  /** Número del ingreso/egreso, si el ledger lo trae. */
  number?: string;
  cashManagementId: number;
  cashRegisterName: string;
  branchName: string;
  amount: number;
  status: string;
  createdBy: string;
  currency: CashCurrency | string;
  exchangeRateNioPerUsd?: number;
  amountNio?: number;
};

export type CashLedgerResponse = {
  records: CashLedgerEntry[];
  paging: CashManagementPaging;
};

// GET /v1/billing/cash-management/{id}/denominations/current
export type CashCurrentDenominationLine = {
  denomination: number;
  quantity: number;
  total: number;
};

export type CashCurrentDenominationCurrency = {
  currency: CashCurrency | string;
  denominatedTotal: number;
  expectedTotal: number; // saldo de esa moneda según los movimientos
  undenominatedAmount: number; // parte registrada sin desglose
  denominations: CashCurrentDenominationLine[];
};

export type CashCurrentDenominations = {
  cashManagementId: number;
  currencies: CashCurrentDenominationCurrency[];
};

export type CashRegisterRecord = {
  id: number;
  name: string;
  description: string;
  code: string;
  branchId: number;
  branchName: string;
};

export type CashRegisterResponse = {
  records: CashRegisterRecord[];
  paging: CashManagementPaging;
};

export type CashRegisterCreatePayload = {
  name: string;
  description: string;
  code: string;
  branchId: number;
};

export type CashRegisterUpdatePayload = {
  name: string | null;
  description: string | null;
  code: string | null;
  branchId: number | null;
};

export type CashManagementMovementTotal = {
  currency: string;
  movementType: string;
  total: number;
  count: number;
};

export type CashManagementMovement = {
  id: number;
  occurredAt: string;
  currency: string;
  amount: number;
  movementType: string;
  sourceType: string;
  sourceId: number | null;
  reversedMovementId: number | null;
  sourceNumber: string;
  description: string;
};

export type CashManagementInvoiceSummary = {
  id: number;
  cashManagementId: number | null;
  document: string;
  chargeStatus: string;
  clientCode: string;
  clientName: string;
  promoterCode: string;
  promoterName: string;
  issuedAt: string;
  invoiceAmountNio: number;
  isVoided: boolean;
  voidedAt: string | null;
  voidedBy: string | null;
};

export type CashManagementPaidInvoiceSummary = CashManagementInvoiceSummary & {
  paidInManagementNio: number;
  paidAmountNio: number;
  remainingBalanceNio: number;
};

export type CashManagementCreditNoteHeader = {
  id: number;
  number: string;
  advisorCode: string;
  invoiceId: number;
  invoiceDocument: string;
  startDate: string;
  total: number;
  status: string;
  cashRegisterId: number | null;
  cashManagementId: number | null;
  cashRegisterCode: string;
  cashRegisterName: string;
  issuedBy: string;
};

export type CashManagementCreditNoteDetail = {
  id: number;
  invoiceLineId: number;
  article: string;
  quantity: number;
  salePrice: number;
  price: number;
  tax1: number;
  tax2: number;
  lineDiscount: number;
  generalDiscount: number;
  isExempt: string;
  total: number;
};

export type CashManagementCreditNoteSummary = {
  header: CashManagementCreditNoteHeader;
  details: CashManagementCreditNoteDetail[];
};

export type CashManagementConversionSummary = {
  id: number;
  cashManagementId: number;
  direction: string;
  exchangeRateNioPerUsd: number;
  sourceTotal: number;
  targetTotal: number;
  theoreticalTargetTotal: number;
  exchangeDifference: number;
  convertedAt: string;
  status: string;
  observation: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  sourceDenominations: CashManagementDenomination[];
  targetDenominations: CashManagementDenomination[];
};

export type CashManagementClosingPreview = {
  expectedNio: number;
  expectedUsd: number;
  actualNioAtClose: number | null;
  actualUsdAtClose: number | null;
  differenceNioAtClose: number | null;
  differenceUsdAtClose: number | null;
  isClosed: boolean;
  requiresObservationIfClosingNow: boolean;
};

export type CashManagementBankTransferSummary = {
  id: number;
  accountNumber: string;
  companyBankAccountId: number;
  companyBankAccountDescription: string;
  bankName: string;
  transferDate: string;
  amount: number;
  collectionId: number | null;
  cashManagementId: number | null;
  isRelated: boolean;
};

export type CashManagementClosingSummary = {
  cashManagement: CashManagementRecord;
  balances: CashManagementBalance;
  movementTotals: CashManagementMovementTotal[];
  movements: CashManagementMovement[];
  collections: CollectionRecord[];
  invoices: CashManagementInvoiceSummary[];
  paidInvoices: CashManagementPaidInvoiceSummary[];
  creditNotes: CashManagementCreditNoteSummary[];
  outflows: CashManagementOutflowRecord[];
  conversions: CashManagementConversionSummary[];
  closingPreview: CashManagementClosingPreview;
  bankTransfers: CashManagementBankTransferSummary[];
  bankTransferIncomeTotalNio: number;
  /** Transferencias aplicadas a facturas en esta gestión (activas y anuladas). Informativo. */
  bankTransferApplications?: BankTransferApplication[];
  /** Suma de las aplicaciones activas. */
  bankTransferAppliedTotalNio?: number;
};