'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { MaterialButton } from '@/components/MaterialButton';
import { MaterialInput } from '@/components/MaterialInput';
import { updateClient } from '@/app/services/clients';
import { ClienteResponse, UpdateClientPayload } from '@/app/type/client';
import { BranchResponse } from '@/app/type/branch';

type Props = {
  cliente: ClienteResponse;
  branches: BranchResponse['records'];
  onClose: () => void;
  onSaved: (updated: ClienteResponse) => void;
};

const CLIENT_TYPE_OPTIONS = ['ASESOR', 'PROMOTOR'] as const;

export default function EditarClienteModal({ cliente, branches, onClose, onSaved }: Props) {
  const [name, setName] = useState(cliente.name);
  const [phoneNumber, setPhoneNumber] = useState(cliente.phoneNumber || '');
  const [idNumber, setIdNumber] = useState(cliente.idNumber || '');
  const [address, setAddress] = useState(cliente.address || '');
  const [province, setProvince] = useState(cliente.province || '');
  const [canton, setCanton] = useState(cliente.canton || '');
  const [district, setDistrict] = useState(cliente.district || '');
  const [clientType, setClientType] = useState<(typeof CLIENT_TYPE_OPTIONS)[number]>(
    cliente.clientType === 'PROMOTOR' ? 'PROMOTOR' : 'ASESOR',
  );
  const [zoneCode, setZoneCode] = useState(cliente.zoneCode || '');
  const [branchCode, setBranchCode] = useState(cliente.branch?.code || '');
  const [promotorCode, setPromotorCode] = useState(cliente.promoter?.code || '');
  const [dateOfEntry, setDateOfEntry] = useState(
    cliente.dateOfEntry ? cliente.dateOfEntry.slice(0, 10) : '',
  );
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !idNumber.trim() || !zoneCode.trim() || !branchCode) {
      setErrorMessage('Complete los campos obligatorios: nombre, identificación, zona y sucursal');
      return;
    }

    setErrorMessage(null);

    const payload: UpdateClientPayload = {
      Name: name.trim(),
      PhoneNumber: phoneNumber.trim() || null,
      IDNumber: idNumber.trim(),
      ClientType: clientType,
      ZoneCode: zoneCode.trim(),
      DateOfEntry: dateOfEntry || undefined,
      Address: address.trim() || null,
      Province: province.trim() || null,
      District: district.trim() || null,
      Canton: canton.trim() || null,
      BranchCode: branchCode,
      PromoterCode: promotorCode.trim() || undefined,
    };

    try {
      setSaving(true);
      await updateClient(cliente.id, payload);

      const updatedBranch = branches.find((branch) => branch.code === branchCode);

      onSaved({
        ...cliente,
        name: name.trim(),
        phoneNumber: phoneNumber.trim() || null,
        idNumber: idNumber.trim(),
        clientType,
        zoneCode: zoneCode.trim(),
        dateOfEntry,
        address: address.trim() || null,
        province: province.trim() || null,
        district: district.trim() || null,
        canton: canton.trim() || null,
        branch: updatedBranch
          ? { id: updatedBranch.id, name: updatedBranch.name, code: updatedBranch.code }
          : cliente.branch,
        promoter: { ...cliente.promoter, code: promotorCode.trim() || cliente.promoter?.code },
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo editar el cliente');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-surface elevation-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-foreground">Editar cliente {cliente.code}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <MaterialInput
            label="Nombre"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />

          <MaterialInput
            label="Identificación"
            fullWidth
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            disabled={saving}
          />

          <MaterialInput
            label="Teléfono"
            fullWidth
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={saving}
          />

          <div>
            <label className="text-sm text-foreground mb-2 block">Tipo de cliente</label>
            <select
              value={clientType}
              onChange={(e) => setClientType(e.target.value as (typeof CLIENT_TYPE_OPTIONS)[number])}
              disabled={saving}
              className="w-full pl-4 pr-4 py-3 bg-input-background border-b-2 border-border
                       focus:border-primary rounded-t transition-colors outline-none"
            >
              {CLIENT_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <MaterialInput
            label="Zona"
            fullWidth
            value={zoneCode}
            onChange={(e) => setZoneCode(e.target.value)}
            disabled={saving}
          />

          <MaterialInput
            label="Código de promotor"
            fullWidth
            value={promotorCode}
            onChange={(e) => setPromotorCode(e.target.value)}
            disabled={saving}
            helperText={
              clientType === 'PROMOTOR' && !promotorCode.trim()
                ? 'Si se deja vacío, se autoasigna al cliente Zermat raíz'
                : undefined
            }
          />

          <div>
            <label className="text-sm text-foreground mb-2 block">Sucursal</label>
            <select
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value)}
              disabled={saving}
              className="w-full pl-4 pr-4 py-3 bg-input-background border-b-2 border-border
                       focus:border-primary rounded-t transition-colors outline-none"
            >
              <option value="">Seleccione una sucursal</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.code}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <MaterialInput
            label="Fecha de ingreso"
            type="date"
            fullWidth
            value={dateOfEntry}
            onChange={(e) => setDateOfEntry(e.target.value)}
            disabled={saving}
          />

          <MaterialInput
            label="Dirección"
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={saving}
          />

          <MaterialInput
            label="Provincia"
            fullWidth
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            disabled={saving}
          />

          <MaterialInput
            label="Cantón"
            fullWidth
            value={canton}
            onChange={(e) => setCanton(e.target.value)}
            disabled={saving}
          />

          <MaterialInput
            label="Distrito"
            fullWidth
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={saving}
          />
        </div>

        {errorMessage && (
          <div className="mx-5 mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
          <MaterialButton variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </MaterialButton>
          <MaterialButton variant="contained" color="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </MaterialButton>
        </div>
      </div>
    </div>
  );
}
