'use client';
import React, { useEffect, useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { Wallet, Plus, Edit, Trash2, Save, X, Building2 } from 'lucide-react';
import { createBankAccount, deleteBankAccount, getBankAccounts, updateBankAccount } from '@/app/lib/api/company/account';
import { Bank, BankAccount } from '@/app/type/bank';
import { getBank } from '@/app/lib/api/bank';



export default function CuentasBanco() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);

  const [showCreateEdit, setShowCreateEdit] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [availableBanks, setAvailableBanks] = useState<Bank[]>([]);
  const [formData, setFormData] = useState({
    account: '',
    description: '',
    bankId: 0
  });

  const handleCreate = () => {
    setEditingAccount(null);
    setFormData({ account: '', description: '', bankId: 0 });
    setShowCreateEdit(true);
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      account: account.accountNumber,
      description: account.description,
      bankId: account.bank.id
    });
    setShowCreateEdit(true);
  };

  useEffect(() => {
      // Aquí podrías cargar las cuentas bancarias desde una API o almacenamiento local
    const fetchAccounts = async () => {
        const accounts = await getBankAccounts();
        setAccounts(accounts.records);
        const babksResponse = await getBank();
        setAvailableBanks(babksResponse.records);
    };

    fetchAccounts();

  },[]);
 

  const handleSave = async () => {
    if (!formData.account.trim() || !formData.description.trim()) {
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const selectedBank = availableBanks.find(b => b.id === formData.bankId);

    if (!selectedBank) {
      alert('Por favor seleccione un banco válido');
      return;
    }

    if (editingAccount) {
      // Update existing account

      const result = await updateBankAccount( 
        {id: editingAccount.id, 
          account: formData.account === editingAccount.accountNumber ? null : formData.account, 
          description: formData.description === editingAccount.description ? null : formData.description, 
          bankId: formData.bankId === editingAccount.bank.id ? null : formData.bankId
        } );

      if (!result.ok) {
        const errorData = await result.json();
        alert('Fallo al actualizar la cuenta bancaria ' + (errorData.message || 'Error desconocido'));
        return;
      }


      setAccounts(accounts.map(a => 
        a.id === editingAccount.id 
          ? { 
              ...a, 
              account: formData.account,
              description: formData.description,
              bankId: formData.bankId,
              bankName: selectedBank.name,
              bankAbbreviation: selectedBank.acronymus
            }
          : a
      ));
    } else {
      // Create new account
      const newAccount: BankAccount = await createBankAccount({
        accountNumber: formData.account,
        description: formData.description,
        bankId: formData.bankId
      });
      setAccounts([...accounts, newAccount]);
    }

    setShowCreateEdit(false);
    setFormData({ account: '', description: '', bankId: 0 });
    setEditingAccount(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro que desea eliminar esta cuenta bancaria?')) {
    const result =  await deleteBankAccount(id);
    if (!result.ok) {
      const errorData = await result.json();
      alert('Fallo al eliminar la cuenta bancaria' + (errorData.message || 'Error desconocido'));
      return;
    }     
      setAccounts(accounts.filter(a => a.id !== id));
    }
  };

  const handleCancel = () => {
    setShowCreateEdit(false);
    setFormData({ account: '', description: '', bankId: 0 });
    setEditingAccount(null);
  };

  if (showCreateEdit) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Wallet size={32} className="text-primary" />
              <h2 className="text-foreground">
                {editingAccount ? 'Editar Cuenta Bancaria' : 'Nueva Cuenta Bancaria'}
              </h2>
            </div>
            <p className="text-muted-foreground">
              {editingAccount 
                ? 'Modifique la información de la cuenta bancaria' 
                : 'Complete la información para registrar una nueva cuenta bancaria de la empresa'}
            </p>
          </div>

          {/* Form */}
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="space-y-6">
              {/* Bank Selection */}
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Banco *
                </label>
                <div className="relative">
                  <Building2 size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={formData.bankId}
                    onChange={(e) => setFormData({ ...formData, bankId: parseInt(e.target.value) })}
                    className="w-full pl-12 pr-4 py-3 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none"
                  >
                      <option value="">
                        Seleccione un banco
                      </option>
                    {availableBanks.map(bank => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name} ({bank.acronymus})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Seleccione la institución bancaria
                </p>
              </div>

              {/* Account Number */}
              <MaterialInput
                label="Número de Cuenta *"
                type="text"
                placeholder="Ej: 10001234567890"
                fullWidth
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                helperText="Número completo de la cuenta bancaria"
                required
              />

              {/* Description */}
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ej: Cuenta Principal para Operaciones"
                  rows={4}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                           focus:border-primary rounded-t transition-colors outline-none resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Descripción o propósito de la cuenta bancaria
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded p-4">
                <p className="text-xs text-primary mb-2">Información</p>
                <p className="text-sm text-foreground">
                  Todos los campos son obligatorios. Asegúrese de ingresar el número de cuenta 
                  correctamente y seleccionar el banco correspondiente.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-border">
              <MaterialButton
                variant="contained"
                color="primary"
                startIcon={<Save size={18} />}
                onClick={handleSave}
              >
                {editingAccount ? 'Actualizar Cuenta' : 'Guardar Cuenta'}
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
              <h2 className="text-foreground">Cuentas de Banco</h2>
            </div>
            <p className="text-muted-foreground">
              Administre las cuentas bancarias de la empresa
            </p>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreate}
          >
            Nueva Cuenta
          </MaterialButton>
        </div>

        {/* Accounts Table */}
        {accounts.length > 0 ? (
          <div className="bg-surface rounded elevation-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Banco</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Número de Cuenta</th>
                    <th className="px-6 py-4 text-left text-sm text-foreground">Descripción</th>
                   {/* <th className="px-6 py-4 text-left text-sm text-foreground">Fecha de Registro</th> */}
                    <th className="px-6 py-4 text-right text-sm text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-foreground">{account.bank.name}</div>
                          <div className="inline-block mt-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                            {account.bank.acronymus}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-foreground">{account.accountNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-foreground">{account.description}</span>
                      </td>
                  {/*    <td className="px-6 py-4">
                        <span className="text-muted-foreground text-sm">
                          {new Date(account.createdAt).toLocaleDateString('es-NI', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </td> */}
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-end">
                          <MaterialButton
                            variant="text"
                            color="primary"
                            startIcon={<Edit size={16} />}
                            onClick={() => handleEdit(account)}
                          >
                            Editar
                          </MaterialButton>
                          <MaterialButton
                            variant="text"
                            color="secondary"
                            startIcon={<Trash2 size={16} />}
                            onClick={() => handleDelete(account.id)}
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
        ) : (
          // Empty State
          <div className="bg-surface rounded elevation-2 py-16 text-center">
            <Wallet size={64} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground mb-2">No hay cuentas bancarias registradas</h3>
            <p className="text-muted-foreground mb-6">
              Comience agregando una nueva cuenta bancaria de la empresa
            </p>
            <MaterialButton
              variant="contained"
              color="primary"
              startIcon={<Plus size={18} />}
              onClick={handleCreate}
            >
              Crear Primera Cuenta
            </MaterialButton>
          </div>
        )}
      </div>
    </div>
  );
}
