'use client';

import React, { useEffect, useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import RoleDetails from '@/components/RoleDetails';
import { getRoles } from '@/app/lib/api/roles';
import { Role } from '@/app/type/user';

interface RoleFormData {
  name: string;
  type: string;
  permissions: string[];
}

export default function RolesScreen() {
  const [roles, setRoles] = useState<Role[]>([]);

  const [showRoleDetails, setShowRoleDetails] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const handleCreateRole = () => {
    setEditingRole(null);
    setShowRoleDetails(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowRoleDetails(true);
  };

  const handleDeleteRole = (roleId: string) => {
    if (confirm('¿Está seguro de eliminar este rol?')) {
      setRoles(roles.filter(r => r.id !== roleId));
    }
  };

  const handleSaveRole = (roleData: RoleFormData) => {
    if (editingRole) {
      setRoles(roles.map(r => 
        r.id === editingRole.id
          ? {
              ...r,
              name: roleData.name,
              type: roleData.type,
              permissions: roleData.permissions.length
            }
          : r
      ));
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        name: roleData.name,
        permissions: roleData.permissions.length,
        users: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setRoles([...roles, newRole]);
    }
    setShowRoleDetails(false);
  };

  const handleCancelRole = () => {
    setShowRoleDetails(false);
    setEditingRole(null);
  };

  useEffect(() => {
    const fetchRoles = async () => {
      const data = await getRoles();
        setRoles(data.records || []);
    }
    fetchRoles();
  }, []);

  const getRoleTypeColor = (type: string) => {
    switch (type) {
      case 'Administrador':
        return 'bg-primary text-primary-foreground';
      case 'Facturador':
        return 'bg-accent text-accent-foreground';
      case 'Supervisor/Coordinador':
        return 'bg-secondary text-secondary-foreground';
      case 'Bodeguero':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (showRoleDetails) {
    return (
      <RoleDetails
        role={editingRole}
        onSave={handleSaveRole}
        onCancel={handleCancelRole}
      />
    );
  }


  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-foreground mb-2">Gestión de Roles</h2>
        <p className="text-muted-foreground">
          Administra los roles y permisos del sistema
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-surface rounded elevation-2 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Shield size={24} className="text-primary" />
            <div>
              <h3 className="text-foreground">Roles del Sistema</h3>
              <p className="text-sm text-muted-foreground">
                {roles.length} roles configurados
              </p>
            </div>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreateRole}
          >
            Crear Nuevo Rol
          </MaterialButton>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-surface rounded elevation-2 p-6 hover:elevation-3 transition-all"
          >
            {/* Role Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield size={24} className="text-primary" />
                </div>
                <div>
                  <h4 className="text-foreground">{role.name}</h4>

                </div>
              </div>
            </div>

            {/* Role Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Permisos</span>
                <span className="text-foreground">{role.permissions}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Usuarios</span>
                <span className="text-foreground">{role.users}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Creado</span>
                <span className="text-sm text-foreground">{role.createdAt}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <MaterialButton
                variant="outlined"
                color="primary"
                fullWidth
                startIcon={<Edit size={16} />}
                onClick={() => handleEditRole(role)}
              >
                Editar
              </MaterialButton>
              <MaterialButton
                variant="outlined"
                color="error"
                onClick={() => handleDeleteRole(role.id)}
              >
                <Trash2 size={16} />
              </MaterialButton>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {roles.length === 0 && (
        <div className="bg-surface rounded elevation-2 p-12 text-center">
          <Shield size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            No hay roles configurados en el sistema
          </p>
          <MaterialButton
            variant="contained"
            color="primary"
            onClick={handleCreateRole}
          >
            Crear Primer Rol
          </MaterialButton>
        </div>
      )}
    </div>
  );
}
