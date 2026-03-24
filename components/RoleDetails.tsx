import React, { useState, useEffect } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Save, X, Shield, CheckSquare, Square } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RoleDetailsProps {
  role: any | null;
  onSave: (roleData: any) => void;
  onCancel: () => void;
}

export default function RoleDetails({ role, onSave, onCancel }: RoleDetailsProps) {
  const [roleName, setRoleName] = useState(role?.name || '');
  const [roleType, setRoleType] = useState(role?.type || 'Facturador');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role?.permissions || []);

  const roleTypes = ['Facturador', 'Bodeguero', 'Supervisor/Coordinador', 'Administrador'];

  const allPermissions: Permission[] = [
    // Users & Security
    { id: 'users.view', name: 'Ver Usuarios', description: 'Ver lista de usuarios', category: 'Usuarios y Seguridad' },
    { id: 'users.create', name: 'Crear Usuarios', description: 'Crear nuevos usuarios', category: 'Usuarios y Seguridad' },
    { id: 'users.edit', name: 'Editar Usuarios', description: 'Modificar usuarios existentes', category: 'Usuarios y Seguridad' },
    { id: 'users.delete', name: 'Eliminar Usuarios', description: 'Eliminar usuarios del sistema', category: 'Usuarios y Seguridad' },
    { id: 'roles.manage', name: 'Gestionar Roles', description: 'Administrar roles y permisos', category: 'Usuarios y Seguridad' },

    // Invoicing
    { id: 'invoices.view', name: 'Ver Facturas', description: 'Ver facturas existentes', category: 'Facturación' },
    { id: 'invoices.create', name: 'Crear Facturas', description: 'Crear nuevas facturas', category: 'Facturación' },
    { id: 'invoices.edit', name: 'Editar Facturas', description: 'Modificar facturas', category: 'Facturación' },
    { id: 'invoices.cancel', name: 'Anular Facturas', description: 'Anular facturas emitidas', category: 'Facturación' },
    { id: 'invoices.export', name: 'Exportar Facturas', description: 'Exportar facturas a PDF/Excel', category: 'Facturación' },

    // Inventory
    { id: 'inventory.view', name: 'Ver Inventario', description: 'Ver productos y stock', category: 'Inventario' },
    { id: 'inventory.create', name: 'Crear Productos', description: 'Añadir nuevos productos', category: 'Inventario' },
    { id: 'inventory.edit', name: 'Editar Productos', description: 'Modificar productos existentes', category: 'Inventario' },
    { id: 'inventory.adjust', name: 'Ajustar Stock', description: 'Realizar ajustes de inventario', category: 'Inventario' },
    { id: 'inventory.transfer', name: 'Transferir Productos', description: 'Transferir entre bodegas', category: 'Inventario' },

    // Reports
    { id: 'reports.sales', name: 'Reportes de Ventas', description: 'Ver reportes de ventas', category: 'Reportes' },
    { id: 'reports.inventory', name: 'Reportes de Inventario', description: 'Ver reportes de inventario', category: 'Reportes' },
    { id: 'reports.financial', name: 'Reportes Financieros', description: 'Ver reportes financieros', category: 'Reportes' },
    { id: 'reports.export', name: 'Exportar Reportes', description: 'Exportar reportes a archivos', category: 'Reportes' },

    // Configuration
    { id: 'config.view', name: 'Ver Configuraciones', description: 'Ver configuraciones del sistema', category: 'Configuración' },
    { id: 'config.edit', name: 'Editar Configuraciones', description: 'Modificar configuraciones', category: 'Configuración' },
    { id: 'config.currency', name: 'Gestionar Monedas', description: 'Configurar tasas de cambio', category: 'Configuración' },
    { id: 'config.company', name: 'Datos de Empresa', description: 'Modificar información de la empresa', category: 'Configuración' },
  ];

  const defaultPermissionsByType: { [key: string]: string[] } = {
    'Facturador': [
      'invoices.view',
      'invoices.create',
      'invoices.edit',
      'invoices.export',
      'inventory.view',
      'reports.sales'
    ],
    'Bodeguero': [
      'inventory.view',
      'inventory.create',
      'inventory.edit',
      'inventory.adjust',
      'inventory.transfer',
      'reports.inventory'
    ],
    'Supervisor/Coordinador': [
      'users.view',
      'invoices.view',
      'invoices.create',
      'invoices.edit',
      'invoices.export',
      'inventory.view',
      'inventory.adjust',
      'reports.sales',
      'reports.inventory',
      'reports.financial',
      'reports.export'
    ],
    'Administrador': allPermissions.map(p => p.id)
  };

  useEffect(() => {
    if (!role) {
      // When creating new role, pre-select based on role type
      setSelectedPermissions(defaultPermissionsByType[roleType] || []);
    }
  }, [roleType, role]);

  const handleRoleTypeChange = (newType: string) => {
    setRoleType(newType);
    // Auto-select default permissions for the role type
    if (!role) {
      setSelectedPermissions(defaultPermissionsByType[newType] || []);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryPermissions = allPermissions
      .filter(p => p.category === category)
      .map(p => p.id);

    const allSelected = categoryPermissions.every(id => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !categoryPermissions.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPermissions])]);
    }
  };

  const handleSave = () => {
    if (!roleName.trim()) {
      alert('Por favor ingrese un nombre para el rol');
      return;
    }

    if (selectedPermissions.length === 0) {
      alert('Por favor seleccione al menos un permiso');
      return;
    }

    onSave({
      name: roleName,
      type: roleType,
      permissions: selectedPermissions
    });
  };

  const categories = Array.from(new Set(allPermissions.map(p => p.category)));

  const isCategoryFullySelected = (category: string) => {
    const categoryPermissions = allPermissions
      .filter(p => p.category === category)
      .map(p => p.id);
    return categoryPermissions.every(id => selectedPermissions.includes(id));
  };

  const isCategoryPartiallySelected = (category: string) => {
    const categoryPermissions = allPermissions
      .filter(p => p.category === category)
      .map(p => p.id);
    return categoryPermissions.some(id => selectedPermissions.includes(id)) &&
           !categoryPermissions.every(id => selectedPermissions.includes(id));
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-foreground mb-2">
          {role ? 'Editar Rol' : 'Crear Nuevo Rol'}
        </h2>
        <p className="text-muted-foreground">
          Configure los detalles y permisos del rol
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Details Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded elevation-2 p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield size={24} className="text-primary" />
              <h3 className="text-foreground">Detalles del Rol</h3>
            </div>

            <div className="flex flex-col gap-6">
              {/* Role Name */}
              <MaterialInput
                label="Nombre del Rol"
                type="text"
                placeholder="Ej: Facturador Principal"
                fullWidth
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                helperText="Ingrese un nombre descriptivo para el rol"
              />

              {/* Role Type */}
              <div>
                <label className="text-sm text-foreground mb-2 block">
                  Tipo de Rol
                </label>
                <select
                  value={roleType}
                  onChange={(e) => handleRoleTypeChange(e.target.value)}
                  className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                           focus:border-primary rounded-t transition-colors outline-none"
                >
                  {roleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  Los permisos se preseleccionan según el tipo de rol
                </p>
              </div>

              {/* Permissions Summary */}
              <div className="bg-muted rounded p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Permisos Seleccionados
                </p>
                <p className="text-2xl text-foreground">
                  {selectedPermissions.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  de {allPermissions.length} disponibles
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-4">
                <MaterialButton
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<Save size={18} />}
                  onClick={handleSave}
                >
                  Guardar Rol
                </MaterialButton>
                <MaterialButton
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={<X size={18} />}
                  onClick={onCancel}
                >
                  Cancelar
                </MaterialButton>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Selection */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded elevation-2 p-6">
            <h3 className="text-foreground mb-4">Permisos del Sistema</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Seleccione los permisos que tendrá este rol. 
              Los permisos están organizados por categorías.
            </p>

            <div className="space-y-6">
              {categories.map(category => {
                const categoryPermissions = allPermissions.filter(p => p.category === category);
                const isFullySelected = isCategoryFullySelected(category);
                const isPartiallySelected = isCategoryPartiallySelected(category);

                return (
                  <div key={category} className="border border-border rounded p-4">
                    {/* Category Header */}
                    <div 
                      className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-muted 
                               p-2 rounded transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center justify-center">
                        {isFullySelected ? (
                          <CheckSquare size={20} className="text-primary" />
                        ) : isPartiallySelected ? (
                          <div className="w-5 h-5 border-2 border-primary rounded flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary rounded"></div>
                          </div>
                        ) : (
                          <Square size={20} className="text-muted-foreground" />
                        )}
                      </div>
                      <h4 className="text-foreground">{category}</h4>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {categoryPermissions.filter(p => selectedPermissions.includes(p.id)).length}/
                        {categoryPermissions.length}
                      </span>
                    </div>

                    {/* Permissions in Category */}
                    <div className="space-y-2 pl-8">
                      {categoryPermissions.map(permission => {
                        const isSelected = selectedPermissions.includes(permission.id);

                        return (
                          <div
                            key={permission.id}
                            className="flex items-start gap-3 p-2 rounded hover:bg-muted 
                                     transition-colors cursor-pointer"
                            onClick={() => togglePermission(permission.id)}
                          >
                            <div className="flex items-center justify-center mt-1">
                              {isSelected ? (
                                <CheckSquare size={18} className="text-primary" />
                              ) : (
                                <Square size={18} className="text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{permission.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
