'use client';
import React, { useState } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { Users, Plus, Edit, Trash2, User as UserIcon, Mail, Key } from 'lucide-react';
import CreateUser from '@/components/CreateUser';
import ChangePasswordModal from '@/components/ChangePasswordModal';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
  empleadoId?: string;
  empleadoNombre?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      username: 'jperez',
      email: 'juan.perez@rodriguezcardoza.com',
      role: 'Administrador',
      status: 'active',
      createdAt: '2025-01-15'
    },
    {
      id: '2',
      firstName: 'María',
      lastName: 'González',
      username: 'mgonzalez',
      email: 'maria.gonzalez@rodriguezcardoza.com',
      role: 'Facturador',
      status: 'active',
      createdAt: '2025-02-10'
    },
    {
      id: '3',
      firstName: 'Carlos',
      lastName: 'Martínez',
      username: 'cmartinez',
      email: 'carlos.martinez@rodriguezcardoza.com',
      role: 'Bodeguero',
      status: 'active',
      createdAt: '2025-02-20'
    }
  ]);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowCreateUser(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowCreateUser(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  interface UserFormData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    role: string;
    empleadoId?: string;
    [key: string]: unknown; // To allow extra fields if needed
  }

  const handleSaveUser = (userData: UserFormData) => {
    // Get empleado name if empleadoId is provided
    const empleadosDisponibles = [
      { id: '', nombre: '' },
      { id: '1', nombre: 'Carlos Alberto Rodríguez Cardoza' },
      { id: '2', nombre: 'María Elena González Pérez' },
      { id: '3', nombre: 'José Luis Martínez López' }
    ];
    
    const empleadoSeleccionado = empleadosDisponibles.find(e => e.id === userData.empleadoId);
    const empleadoNombre = empleadoSeleccionado ? empleadoSeleccionado.nombre : '';

    if (editingUser) {
      setUsers(users.map(u => 
        u.id === editingUser.id
          ? {
              ...u,
              ...userData,
              empleadoNombre
            }
          : u
      ));
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        ...userData,
        empleadoNombre,
        status: 'active' as const,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setUsers([...users, newUser]);
    }
    setShowCreateUser(false);
  };

  const handleCancelUser = () => {
    setShowCreateUser(false);
    setEditingUser(null);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setShowChangePassword(true);
  };

  const handleSavePassword = (userId: string, newPassword: string) => {
    // In a real application, this would make an API call to update the password
    console.log(`Password updated for user ${userId}: ${newPassword}`);
    
    // Show success message
    alert('Contraseña actualizada exitosamente');
    
    // Close modal
    setShowChangePassword(false);
    setSelectedUser(null);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
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

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (showCreateUser) {
    return (
      <CreateUser
        user={editingUser}
        onSave={handleSaveUser}
        onCancel={handleCancelUser}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-foreground mb-2">Gestión de Usuarios</h2>
        <p className="text-muted-foreground">
          Administra los usuarios del sistema
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-surface rounded elevation-2 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Users size={24} className="text-primary" />
            <div>
              <h3 className="text-foreground">Usuarios del Sistema</h3>
              <p className="text-sm text-muted-foreground">
                {users.length} usuarios registrados
              </p>
            </div>
          </div>
          <MaterialButton
            variant="contained"
            color="primary"
            startIcon={<Plus size={18} />}
            onClick={handleCreateUser}
          >
            Crear Nuevo Usuario
          </MaterialButton>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface rounded elevation-2 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-foreground">Usuario</th>
                <th className="px-6 py-4 text-left text-sm text-foreground">Nombre Completo</th>
                <th className="px-6 py-4 text-left text-sm text-foreground">Correo</th>
                <th className="px-6 py-4 text-left text-sm text-foreground">Rol</th>
                <th className="px-6 py-4 text-left text-sm text-foreground">Estado</th>
                <th className="px-6 py-4 text-left text-sm text-foreground">Fecha Creación</th>
                <th className="px-6 py-4 text-left text-sm text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr 
                  key={user.id}
                  className={`border-b border-border hover:bg-muted/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-muted/20'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon size={20} className="text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">
                      {user.firstName} {user.lastName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs ${getStatusColor(user.status)}`}>
                      {user.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{user.createdAt}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <MaterialButton
                        variant="text"
                        color="primary"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit size={16} />
                      </MaterialButton>
                      <MaterialButton
                        variant="text"
                        color="error"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={16} />
                      </MaterialButton>
                      <MaterialButton
                        variant="text"
                        color="primary"
                        onClick={() => handleChangePassword(user)}
                      >
                        <Key size={16} />
                      </MaterialButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="bg-surface rounded elevation-2 p-12 text-center">
          <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            No hay usuarios registrados en el sistema
          </p>
          <MaterialButton
            variant="contained"
            color="primary"
            onClick={handleCreateUser}
          >
            Crear Primer Usuario
          </MaterialButton>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && selectedUser && (
        <ChangePasswordModal
          user={selectedUser}
          onSave={handleSavePassword}
          onClose={() => {
            setShowChangePassword(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}