'use client';
import React, { useState, useEffect } from 'react';
import { MaterialButton } from '@/components/MaterialButton';
import { Users, Plus, Edit, Trash2, User as UserIcon, Mail, Key } from 'lucide-react';
import CreateUser from '@/components/CreateUser';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { insertUser, getUsers, updateUser , updatePassword, deleteUser } from '@/app/lib/api/user';
import { CreateUserDto, User, UpdateUserDto, UserFormData } from '@/app/type/user';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);

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

  const handleDeleteUser = async (userId: string) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      const response = await deleteUser(userId);
      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar usuario: ${errorData.message || 'Error desconocido'}`);
      }
    }
  };


  useEffect(() => {
     const fetchUsers = async () => {
      const response = await getUsers(); // Implementa esta función para obtener los usuarios desde tu API
       const data = await response.json();

      setUsers(data?.records || []); // Asegúrate de ajustar esto según la estructura real de tu respuesta API
    };
    fetchUsers();
  }, []);



  const handleSaveUser = async (userData: UserFormData) => {
  const newUser: User = {
        id: Date.now().toString(),
        name: userData.firstName,
        lastName: userData.lastName,
        userName: userData.username,
        email: userData.email,
        role :  {
          id: userData.roleId,
          name: userData.role,
          permissions: 0,
          users: 0,
          createdAt: new Date().toISOString().split('T')[0]
        },
        isArchived: false,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };

    if (editingUser) {

     const user :   UpdateUserDto ={
        id: editingUser.id,
        name: editingUser.name !== newUser.name ? newUser.name : null,
        lastName: editingUser.lastName !== newUser.lastName ? newUser.lastName : null,
        userName: editingUser.userName !== newUser.userName ? newUser.userName : null,
        email: editingUser.email !== newUser.email ? newUser.email : null,
        roleId: newUser.role.id
      }
        const response = await updateUser(user);

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error al actualizar usuario: ${errorData.message || 'Error desconocido'}`);
        return;
      } 

     setUsers(users.map((u: User) => 
      u.id === editingUser.id
        ? {
            ...u,
            ...newUser,
          } as User
        : u
      ));
    } else {
      const user: CreateUserDto = {
        name: newUser.name,
        lastName: newUser.lastName,
        userName: newUser.userName,
        email: newUser.email,
        password: userData.password,
        roleId: newUser.role.id
      }
      const response = await insertUser(user);

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error al crear usuario: ${errorData.message || 'Error desconocido'}`);
        return;
      }
      
      const newlyCreatedUser : User = await response.json();
      
      setUsers([...users, newlyCreatedUser]);

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

  const handleSavePassword = async (userId: string, newPassword: string) => {
    try {
    
   const result = await updatePassword(userId, newPassword);

    if (!result.ok) {
      const errorData = await result.json();
      alert(`Error al actualizar contraseña: ${errorData.message || 'Error desconocido'}`);
      return;
    }

    // Show success message
    alert('Contraseña actualizada exitosamente');
    
    // Close modal
    setShowChangePassword(false);
    setSelectedUser(null);
    } catch (error) {
      alert(`Error al actualizar contraseña: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }

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
                      <span className="text-sm text-foreground">{user.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">
                      {user.name} {user.lastName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-muted-foreground" />
                      <span className="text-sm text-foreground">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs ${getRoleColor(user.role.name)}`}>
                      {user.role.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs ${getStatusColor(!user.isArchived ? 'active' : 'inactive')}`}>
                      {!user.isArchived ? 'Activo' : 'Inactivo'}
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