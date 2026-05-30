'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Trash2,
  Users
} from 'lucide-react';

import { MaterialButton } from '../../../components/MaterialButton';
import { Client, ClienteExcel, ClienteResponse, Paging, ErrorResponse, ClientErrorItem } from '@/app/type/client';
import { ImportarClientesModal } from '@/components/excel-upload-client';
import { createClient, getclients } from '@/app/lib/api/clients';
import { getBranches } from '@/app/lib/api/company/branch';
import { BranchResponse } from '@/app/type/branch';
import ModaleErrorCreateClient from '@/components/modal-error-create-client';


interface ApiResponse {
  records: ClienteResponse[];
  paging: Paging;
}

export default function ClientesPage () {
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse['records']>([]);
  const [selectedBranch, setSelectedBranch] = useState<number>(0);
  const [errorCreateClient, setErrorCreateClient] = useState<ClientErrorItem[]>([]);
  const [paging, setPaging] = useState<Paging>({
    perPage: 10,
    currentPage: 1,
    totalRecords: 0,
    totalPages: 1
  });

  const [importModalOpen, setImportModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClientes(1);
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const branches : BranchResponse = await getBranches();
     setBranches(branches.records);
    }
    catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const handleImport = async (data: ClienteExcel[]) => {
   
    const dataProcessed: Client[] = data
  .map((item) => ({
    id: 0,
    code: item.code,
    name: item.name,
    phoneNumber: item.phoneNumber || '',
    idNumber: item.idNumber || '',
    address: item.address || '',
    province: item.province || '',
    canton: item.canton || '',
    district: item.district || '',
    clientType: item.clientType,
    zoneCode: item.zoneCode,
    dateOfEntry: item.dateOfEntry,
    promotorCode: item.promoterCode,
    branchCode:
      branches.length > 0
        ? branches.find((b) => b.name === item.branchName)?.code || 'DEFAULT_BRANCH'
        : 'DEFAULT_BRANCH',
    creator: 'admin',
  }))
  .sort((a, b) => Number(a.promotorCode || 0) - Number(b.promotorCode || 0));

    dataProcessed.forEach(async (client, index) => {
      try {
      const response = await createClient(client);
      if (!response.ok) {        
        const errorData : ErrorResponse = await response.json();
        console.error(`Error al importar cliente ${client.name}:`, errorData);
        setErrorCreateClient((prev) => [...prev, 
          { fila: index + 1,
            name: client.name, 
            error: errorData.detail || 'Error desconocido',
            titulo : errorData.title || 'Error' }]);
      }
      } catch (error) {
        console.error(`Error al importar cliente ${client.name}:`, error);
      }
    });
  };

  const loadClientes = async (page: number) => {
    try {
      setLoading(true);

      // EJEMPLO API
       const response: ApiResponse  = await getclients(); // Reemplaza con tu función real para obtener clientes


      // DEMO
      
      setClientes(response.records);
      setPaging(response.paging);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (
      page < 1 ||
      page > paging.totalPages ||
      page === paging.currentPage
    ) {
      return;
    }

    loadClientes(page);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Desea eliminar este cliente?')) {
      setClientes((prev) => prev.filter((x) => x.id !== id));
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users size={32} className="text-primary" />

              <h2 className="text-foreground">
                Clientes
              </h2>
            </div>

            <p className="text-muted-foreground">
              Administre los clientes del sistema
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <select className="border border-border rounded-lg px-3 py-2" value={selectedBranch} onChange={(e) => setSelectedBranch(parseInt(e.target.value))}>
                <option value={0}>Todas las sucursales</option>
                {
                  branches.length > 0 && branches.map((branch) => (
                    <option key={branch.id} value={branch.code}>{branch.name}</option>
                  ))
                }
              </select>
            </div>
            </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              <select
                className="border border-border rounded-lg px-3 py-2"
                value={paging.perPage}
                onChange={(e) => {
                  const perPage = parseInt(e.target.value);
                  setPaging((prev) => ({ ...prev, perPage }));
                }}
              >
                <option value={10}>10 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>
            </div>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={() => setImportModalOpen(true)}
          >
            Importar Cliente
          </MaterialButton>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-xl elevation-2 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm">
                    Código
                  </th>

                  <th className="px-6 py-4 text-left text-sm">
                    Nombre
                  </th>

                  <th className="px-6 py-4 text-left text-sm">
                    Identificación
                  </th>

                  <th className="px-6 py-4 text-left text-sm">
                    Tipo
                  </th>

                  <th className="px-6 py-4 text-left text-sm">
                    Sucursal
                  </th>

                  <th className="px-6 py-4 text-right text-sm">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10"
                    >
                      Cargando...
                    </td>
                  </tr>
                ) : clientes.length > 0 ? (
                  clientes.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">
                          {cliente.code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {cliente.name}
                      </td>

                      <td className="px-6 py-4">
                        {cliente.idNumber}
                      </td>

                      <td className="px-6 py-4">
                        {cliente.clientType}
                      </td>

                      <td className="px-6 py-4">
                        {cliente.branch.name}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            className="
                              p-2
                              rounded-lg
                              hover:bg-blue-100
                              text-blue-600
                            "
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(cliente.id)
                            }
                            className="
                              p-2
                              rounded-lg
                              hover:bg-red-100
                              text-red-600
                            "
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10"
                    >
                      No hay registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div
            className="
              flex
              flex-col
              md:flex-row
              items-center
              justify-between
              gap-4
              px-6
              py-4
              border-t
              border-border
            "
          >
            {/* Info */}
            <div className="text-sm text-muted-foreground">
              Mostrando página{' '}
              <span className="font-medium text-foreground">
                {paging.currentPage}
              </span>{' '}
              de{' '}
              <span className="font-medium text-foreground">
                {paging.totalPages}
              </span>{' '}
              — Total registros:{' '}
              <span className="font-medium text-foreground">
                {paging.totalRecords}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {/* Previous */}
              <button
                onClick={() =>
                  goToPage(paging.currentPage - 1)
                }
                disabled={paging.currentPage === 1}
                className="
                  h-10
                  px-4
                  rounded-lg
                  border
                  border-border
                  flex
                  items-center
                  gap-2
                  hover:bg-muted
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                <ChevronLeft size={18} />
                Anterior
              </button>

              {/* Page Numbers */}
              {Array.from(
                { length: paging.totalPages },
                (_, index) => {
                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`
                        h-10
                        w-10
                        rounded-lg
                        border
                        transition-colors
                        ${
                          paging.currentPage === page
                            ? 'bg-primary text-white border-primary'
                            : 'border-border hover:bg-muted'
                        }
                      `}
                    >
                      {page}
                    </button>
                  );
                }
              )}

              {/* Next */}
              <button
                onClick={() =>
                  goToPage(paging.currentPage + 1)
                }
                disabled={
                  paging.currentPage === paging.totalPages
                }
                className="
                  h-10
                  px-4
                  rounded-lg
                  border
                  border-border
                  flex
                  items-center
                  gap-2
                  hover:bg-muted
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                Siguiente
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
        <ImportarClientesModal isOpen={importModalOpen}  onClose={()=> setImportModalOpen(false)} onImport={handleImport} />
        <ModaleErrorCreateClient open={errorCreateClient.length > 0} errors={errorCreateClient} onClose={() => setErrorCreateClient([])} />
      </div>
    </div>
  );
}