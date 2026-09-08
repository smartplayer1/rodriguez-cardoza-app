'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { ArrowLeftRight, ChevronDown, Save } from 'lucide-react';
import { useUserStore } from '@/app/store/useUserStore';
import { PERMISSIONS } from '@/app/domain/auth/permissions';
import { getBankAccounts } from '@/app/services/company/account';
import { getCashManagementRecords } from '@/app/services/cash-management';
import {
  createBankTransfer,
  getUnrelatedBankTransfers,
} from '@/app/services/billing/bank-transfer';
import { BankTransferRecord } from '@/app/type/bank-transfer';
import { ListSkeleton, TableSkeleton } from '@/components/ui/loading-skeleton';

type BankAccountOption = {
  id: number;
  accountNumber: string;
  label: string;
};

type CashManagementOption = {
  id: string;
  label: string;
};

const DEFAULT_PER_PAGE = 10;
const TEMP_RESPONSIBLE_EMPLOYEE_ID = null;

const formatAmount = (value: number) => {
  return new Intl.NumberFormat('es-NI', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function TransferenciasBancariasPage() {
  const { can } = useUserStore();
  const canCreate = can(PERMISSIONS.BANK_TRANSFER_CREATE);
  const canView = can(PERMISSIONS.BANK_TRANSFER_VIEW);

  const [bankAccountOptions, setBankAccountOptions] = useState<BankAccountOption[]>([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(false);

  const [cashManagementOptions, setCashManagementOptions] = useState<CashManagementOption[]>([]);
  const [cashManagementLoading, setCashManagementLoading] = useState(false);

  const [formData, setFormData] = useState({
    companyBankAccountId: '',
    accountNumber: '',
    transferDate: new Date().toISOString().slice(0, 10),
    amount: '',
    cashManagementId: '',
  });
  const [saving, setSaving] = useState(false);

  const [transfers, setTransfers] = useState<BankTransferRecord[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(false);
  const [transfersError, setTransfersError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadBankAccounts = useCallback(async () => {
    try {
      setBankAccountsLoading(true);
      const response = await getBankAccounts();
      const options = (response.records || []).map(
        (account: { id: number; accountNumber: string; bank: { name: string } }) => ({
          id: account.id,
          accountNumber: account.accountNumber,
          label: `${account.accountNumber} - ${account.bank.name}`,
        }),
      );
      setBankAccountOptions(options);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      setBankAccountOptions([]);
    } finally {
      setBankAccountsLoading(false);
    }
  }, []);

  const loadCashManagementOptions = useCallback(async () => {
    try {
      setCashManagementLoading(true);
      const response = await getCashManagementRecords({
        status: 'OPEN',
        responsibleEmployeeId: TEMP_RESPONSIBLE_EMPLOYEE_ID,
        page: 1,
        perPage: 100,
      });
      const options = (response.records || []).map((record) => ({
        id: String(record.id),
        label: `${record.cashRegisterCode} - ${record.cashRegisterName} - ${record.responsibleEmployeeName}`,
      }));
      setCashManagementOptions(options);
    } catch (error) {
      console.error('Error loading open cash management records:', error);
      setCashManagementOptions([]);
    } finally {
      setCashManagementLoading(false);
    }
  }, []);

  const loadTransfers = useCallback(async () => {
    try {
      setTransfersLoading(true);
      setTransfersError(null);
      const response = await getUnrelatedBankTransfers({
        page: currentPage,
        perPage: DEFAULT_PER_PAGE,
      });
      setTransfers(response.records || []);
      setTotalPages(Math.max(1, response.paging?.totalPages || 1));
    } catch (error) {
      console.error('Error loading unrelated bank transfers:', error);
      setTransfersError(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar las transferencias pendientes',
      );
      setTransfers([]);
    } finally {
      setTransfersLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    void loadBankAccounts();
  }, [loadBankAccounts]);

  useEffect(() => {
    void loadCashManagementOptions();
  }, [loadCashManagementOptions]);

  useEffect(() => {
    void loadTransfers();
  }, [loadTransfers]);

  const handleSave = async () => {
    const companyBankAccountId = Number(formData.companyBankAccountId);
    const amount = Number(formData.amount);

    if (!companyBankAccountId) {
      alert('Seleccione una cuenta bancaria de la empresa');
      return;
    }

    if (!formData.accountNumber.trim()) {
      alert('Ingrese el número de cuenta de origen');
      return;
    }

    if (!formData.transferDate) {
      alert('Ingrese la fecha de la transferencia');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Ingrese un monto válido');
      return;
    }

    try {
      setSaving(true);
      await createBankTransfer({
        accountNumber: formData.accountNumber.trim(),
        companyBankAccountId,
        transferDate: new Date(formData.transferDate).toISOString(),
        amount,
        cashManagementId: formData.cashManagementId
          ? Number(formData.cashManagementId)
          : null,
      });
      setFormData({
        companyBankAccountId: '',
        accountNumber: '',
        transferDate: new Date().toISOString().slice(0, 10),
        amount: '',
        cashManagementId: '',
      });
      setCurrentPage(1);
      await loadTransfers();
      alert('Transferencia registrada correctamente');
    } catch (error) {
      console.error('Error creating bank transfer:', error);
      alert(
        error instanceof Error ? error.message : 'No se pudo registrar la transferencia',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <ArrowLeftRight size={28} className="text-primary" />
          <h2 className="text-foreground">Transferencias Bancarias</h2>
        </div>
        <p className="text-muted-foreground">
          Registre depósitos/transferencias sueltas y consulte las pendientes de relacionar con
          un cobro o una factura
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canCreate && (
          <div className="lg:col-span-1">
            <div className="bg-surface rounded elevation-2 p-6">
              <h3 className="text-foreground mb-4">Nueva Transferencia</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm text-foreground mb-2 block">
                    Cuenta bancaria (empresa) *
                  </label>
                  {bankAccountsLoading ? (
                    <ListSkeleton count={1} itemClassName="h-12 rounded-t" />
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.companyBankAccountId}
                        onChange={(e) =>
                          setFormData({ ...formData, companyBankAccountId: e.target.value })
                        }
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                      >
                        <option value="">Seleccione una cuenta</option>
                        {bankAccountOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={20}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                    </div>
                  )}
                </div>

                <MaterialInput
                  label="Número de referencia / documento*"
                  fullWidth
                  value={formData.accountNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, accountNumber: e.target.value })
                  }
                />

                <MaterialInput
                  label="Fecha *"
                  type="date"
                  fullWidth
                  value={formData.transferDate}
                  onChange={(e) =>
                    setFormData({ ...formData, transferDate: e.target.value })
                  }
                />

                <MaterialInput
                  label="Monto *"
                  type="number"
                  min={0}
                  step="0.01"
                  fullWidth
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />

                <div>
                  <label className="text-sm text-foreground mb-2 block">
                    Gestión de caja (opcional)
                  </label>
                  {cashManagementLoading ? (
                    <ListSkeleton count={1} itemClassName="h-12 rounded-t" />
                  ) : (
                    <div className="relative">
                      <select
                        value={formData.cashManagementId}
                        onChange={(e) =>
                          setFormData({ ...formData, cashManagementId: e.target.value })
                        }
                        className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border
                                 focus:border-primary rounded-t transition-colors outline-none appearance-none"
                      >
                        <option value="">Sin asociar a una caja</option>
                        {cashManagementOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={20}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Si la asocia, se reportará como ingreso informativo en el cierre de esa
                    caja (no afecta el cuadre de efectivo).
                  </p>
                </div>

                <MaterialButton
                  variant="contained"
                  color="primary"
                  startIcon={<Save size={18} />}
                  onClick={handleSave}
                  disabled={saving}
                  fullWidth
                >
                  {saving ? 'Guardando...' : 'Registrar Transferencia'}
                </MaterialButton>
              </div>
            </div>
          </div>
        )}

        {canView && (
          <div className={canCreate ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-surface rounded elevation-2 p-6">
              <h3 className="text-foreground mb-4">
                Transferencias Pendientes de Relacionar
              </h3>

              {transfersError ? (
                <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {transfersError}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left">Banco</th>
                        <th className="px-4 py-3 text-left">Cuenta origen</th>
                        <th className="px-4 py-3 text-left">Cuenta empresa</th>
                        <th className="px-4 py-3 text-left">Fecha</th>
                        <th className="px-4 py-3 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transfersLoading ? (
                        <TableSkeleton columns={5} />
                      ) : transfers.length > 0 ? (
                        transfers.map((transfer) => (
                          <tr key={transfer.id} className="hover:bg-muted/20">
                            <td className="px-4 py-3 text-foreground">
                              {transfer.bankName}
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {transfer.accountNumber}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {transfer.companyBankAccountDescription}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(transfer.transferDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-foreground">
                              {formatAmount(transfer.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-muted-foreground">
                            No hay transferencias pendientes de relacionar
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <MaterialButton
                      variant="outlined"
                      color="secondary"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </MaterialButton>
                    <MaterialButton
                      variant="outlined"
                      color="secondary"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </MaterialButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
