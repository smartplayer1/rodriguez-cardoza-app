import React, { useState, useEffect } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Save, X, User, Shuffle, Eye, EyeOff, Shield, Mail, UserCircle, ChevronDown } from 'lucide-react';

interface CreateUserProps {
  user: any | null;
  onSave: (userData: any) => void;
  onCancel: () => void;
}

export default function CreateUser({ user, onSave, onCancel }: CreateUserProps) {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'Facturador');
  const [empleadoId, setEmpleadoId] = useState(user?.empleadoId || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const roles = ['Facturador', 'Bodeguero', 'Supervisor/Coordinador', 'Administrador'];
  
  // Mock employees data - in a real app, this would be fetched from the Empleados module
  const empleadosDisponibles = [
    { id: '', nombre: 'Ninguno (No asignar empleado)' },
    { id: '1', nombre: 'Carlos Alberto Rodríguez Cardoza' },
    { id: '2', nombre: 'María Elena González Pérez' },
    { id: '3', nombre: 'José Luis Martínez López' }
  ];

  // Auto-generate username when first name or last name changes
  useEffect(() => {
    if (!user && firstName && lastName) {
      const autoUsername = generateUsername(firstName, lastName);
      if (!username) {
        setUsername(autoUsername);
      }
    }
  }, [firstName, lastName, user]);

  // Auto-generate email when username changes
  useEffect(() => {
    if (!user && username) {
      const autoEmail = `${username.toLowerCase()}@rodriguezcardoza.com`;
      if (!email) {
        setEmail(autoEmail);
      }
    }
  }, [username, user]);

  const generateUsername = (first: string, last: string): string => {
    const firstPart = first.toLowerCase().charAt(0);
    const lastPart = last.toLowerCase().replace(/\s+/g, '');
    return `${firstPart}${lastPart}`;
  };

  const handleGenerateUsername = () => {
    if (firstName && lastName) {
      const generated = generateUsername(firstName, lastName);
      setUsername(generated);
      setEmail(`${generated.toLowerCase()}@rodriguezcardoza.com`);
    } else {
      alert('Por favor ingrese el nombre y apellido primero');
    }
  };

  const generatePassword = (): string => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(Math.floor(Math.random() * 26));
    password += 'abcdefghijklmnopqrstuvwxyz'.charAt(Math.floor(Math.random() * 26));
    password += '0123456789'.charAt(Math.floor(Math.random() * 10));
    password += '!@#$%^&*'.charAt(Math.floor(Math.random() * 8));
    
    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGeneratePassword = () => {
    const generated = generatePassword();
    setPassword(generated);
    setConfirmPassword(generated);
  };

  const handleSave = () => {
    // Validation
    if (!firstName.trim()) {
      alert('Por favor ingrese el nombre');
      return;
    }

    if (!lastName.trim()) {
      alert('Por favor ingrese el apellido');
      return;
    }

    if (!username.trim()) {
      alert('Por favor ingrese el nombre de usuario');
      return;
    }

    if (!email.trim()) {
      alert('Por favor ingrese el correo electrónico');
      return;
    }

    if (!user && !password) {
      alert('Por favor ingrese una contraseña');
      return;
    }

    if (!user && password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!user && password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const userData = {
      firstName,
      lastName,
      username,
      email,
      role,
      empleadoId
    };

    onSave(userData);
  };

  const getRoleDescription = (roleType: string) => {
    switch (roleType) {
      case 'Facturador':
        return 'Puede crear y gestionar facturas';
      case 'Bodeguero':
        return 'Puede gestionar inventario y stock';
      case 'Supervisor/Coordinador':
        return 'Puede supervisar operaciones y generar reportes';
      case 'Administrador':
        return 'Tiene acceso completo al sistema';
      default:
        return '';
    }
  };

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-foreground mb-2">
          {user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
        </h2>
        <p className="text-muted-foreground">
          Complete la información del usuario
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Form */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded elevation-2 p-6">
            <div className="flex items-center gap-2 mb-6">
              <User size={24} className="text-primary" />
              <h3 className="text-foreground">Información Personal</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <MaterialInput
                label="Nombre"
                type="text"
                placeholder="Ej: Juan"
                fullWidth
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                helperText="Ingrese el nombre del usuario"
              />

              {/* Last Name */}
              <MaterialInput
                label="Apellido"
                type="text"
                placeholder="Ej: Pérez"
                fullWidth
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                helperText="Ingrese el apellido del usuario"
              />
            </div>

            {/* Divider */}
            <div className="my-8 border-t border-border"></div>

            <div className="flex items-center gap-2 mb-6">
              <Shield size={24} className="text-primary" />
              <h3 className="text-foreground">Credenciales de Acceso</h3>
            </div>

            {/* Username with auto-generate */}
            <div className="mb-6">
              <label className="text-sm text-foreground mb-2 block">
                Nombre de Usuario
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej: jperez"
                    className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Identificador único para el inicio de sesión
                  </p>
                </div>
                <MaterialButton
                  variant="outlined"
                  color="primary"
                  startIcon={<Shuffle size={18} />}
                  onClick={handleGenerateUsername}
                >
                  Generar
                </MaterialButton>
              </div>
            </div>

            {/* Email */}
            <div className="mb-6">
              <MaterialInput
                label="Correo Electrónico"
                type="email"
                placeholder="Ej: usuario@rodriguezcardoza.com"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="Dirección de correo electrónico del usuario"
              />
            </div>

            {/* Password with auto-generate - only show when creating new user */}
            {!user && (
              <>
                <div className="mb-6">
                  <label className="text-sm text-foreground mb-2 block">
                    Contraseña
                  </label>
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingrese una contraseña"
                        className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                                 focus:border-primary rounded-t transition-colors outline-none pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground 
                                 hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <MaterialButton
                      variant="outlined"
                      color="primary"
                      startIcon={<Shuffle size={18} />}
                      onClick={handleGeneratePassword}
                    >
                      Generar
                    </MaterialButton>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres. Incluya mayúsculas, minúsculas y números.
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="mb-6">
                  <label className="text-sm text-foreground mb-2 block">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme la contrase��a"
                      className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                               focus:border-primary rounded-t transition-colors outline-none pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground 
                               hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-600 mt-2">
                      Las contraseñas no coinciden
                    </p>
                  )}
                  {password && confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-green-600 mt-2">
                      Las contraseñas coinciden ✓
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Password change notice for editing */}
            {user && (
              <div className="bg-muted rounded p-4 mb-6">
                <p className="text-sm text-foreground">
                  Para cambiar la contraseña, utilice la opción "Restablecer Contraseña" 
                  en la lista de usuarios.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Role Selection & Summary */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded elevation-2 p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-6">
              <Shield size={24} className="text-primary" />
              <h3 className="text-foreground">Asignación de Rol</h3>
            </div>

            {/* Role Dropdown */}
            <div className="mb-6">
              <label className="text-sm text-foreground mb-2 block">
                Rol del Usuario
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                         focus:border-primary rounded-t transition-colors outline-none"
              >
                {roles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Role Description */}
            <div className="bg-primary/5 border border-primary/20 rounded p-4 mb-6">
              <p className="text-xs text-primary mb-2">Descripción del Rol</p>
              <p className="text-sm text-foreground">
                {getRoleDescription(role)}
              </p>
            </div>

            {/* Divider */}
            <div className="my-6 border-t border-border"></div>

            {/* Empleado Asignado Section */}
            <div className="flex items-center gap-2 mb-6">
              <UserCircle size={24} className="text-primary" />
              <h3 className="text-foreground">Empleado Asignado</h3>
            </div>

            {/* Empleado Dropdown */}
            <div className="mb-6">
              <label className="text-sm text-foreground mb-2 block">
                Empleado Asignado <span className="text-muted-foreground">(Opcional)</span>
              </label>
              <div className="relative">
                <select
                  value={empleadoId}
                  onChange={(e) => setEmpleadoId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-input-background border-b-2 border-border 
                           focus:border-primary rounded-t transition-colors outline-none appearance-none"
                >
                  {empleadosDisponibles.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown size={20} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Vincule este usuario con un registro de empleado existente
              </p>
            </div>

            {/* Info about optional field */}
            <div className="bg-muted/50 border border-border rounded p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-2">Información</p>
              <p className="text-sm text-foreground">
                Asignar un empleado es opcional. Esta vinculación permite relacionar el usuario del sistema 
                con el registro de empleado de la empresa.
              </p>
            </div>

            {/* User Summary */}
            <div className="bg-muted rounded p-4 mb-6">
              <p className="text-xs text-muted-foreground mb-3">Resumen</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <User size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nombre</p>
                    <p className="text-sm text-foreground">
                      {firstName && lastName ? `${firstName} ${lastName}` : 'Sin especificar'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Usuario</p>
                    <p className="text-sm text-foreground">
                      {username || 'Sin especificar'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Correo</p>
                    <p className="text-sm text-foreground">
                      {email || 'Sin especificar'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Rol</p>
                    <p className="text-sm text-foreground">{role}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <MaterialButton
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<Save size={18} />}
                onClick={handleSave}
              >
                {user ? 'Actualizar Usuario' : 'Crear Usuario'}
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
    </div>
  );
}