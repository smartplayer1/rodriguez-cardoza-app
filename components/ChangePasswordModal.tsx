import React, { useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Save, X, Eye, EyeOff, Shuffle, Lock } from 'lucide-react';

interface ChangePasswordModalProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  onSave: (userId: string, newPassword: string) => void;
  onClose: () => void;
}

export default function ChangePasswordModal({ user, onSave, onClose }: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    setNewPassword(generated);
    setConfirmPassword(generated);
  };

  const handleSave = () => {
    // Validation
    if (!newPassword) {
      alert('Por favor ingrese una nueva contraseña');
      return;
    }

    if (newPassword.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    onSave(user.id, newPassword);
  };

  const getPasswordStrength = (password: string): { strength: string; color: string; percentage: number } => {
    if (!password) return { strength: '', color: '', percentage: 0 };
    
    let strength = 0;
    
    // Length
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 15;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 15;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 15;
    
    // Contains numbers
    if (/\d/.test(password)) strength += 15;
    
    // Contains special characters
    if (/[!@#$%^&*]/.test(password)) strength += 15;
    
    if (strength < 40) {
      return { strength: 'Débil', color: 'bg-red-500', percentage: strength };
    } else if (strength < 70) {
      return { strength: 'Media', color: 'bg-yellow-500', percentage: strength };
    } else {
      return { strength: 'Fuerte', color: 'bg-green-500', percentage: strength };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-surface rounded elevation-4 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="text-foreground">Cambiar Contraseña</h3>
                <p className="text-sm text-muted-foreground">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded hover:bg-muted transition-colors"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* User Info */}
            <div className="bg-muted rounded p-3">
              <p className="text-xs text-muted-foreground mb-1">Usuario</p>
              <p className="text-sm text-foreground">{user.username}</p>
            </div>

            {/* New Password */}
            <div>
              <label className="text-sm text-foreground mb-2 block">
                Nueva Contraseña
              </label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Ingrese la nueva contraseña"
                    className="w-full px-4 py-3 bg-input-background border-b-2 border-border 
                             focus:border-primary rounded-t transition-colors outline-none pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground 
                             hover:text-foreground transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Fortaleza de la contraseña:
                    </span>
                    <span className="text-xs text-foreground">
                      {passwordStrength.strength}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${passwordStrength.color} transition-all duration-300`}
                      style={{ width: `${passwordStrength.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Mínimo 8 caracteres. Incluya mayúsculas, minúsculas, números y símbolos.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm text-foreground mb-2 block">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme la nueva contraseña"
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
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600 mt-2">
                  Las contraseñas no coinciden
                </p>
              )}
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-green-600 mt-2">
                  Las contraseñas coinciden ✓
                </p>
              )}
            </div>

            {/* Password Requirements Checklist */}
            <div className="bg-muted rounded p-4">
              <p className="text-xs text-muted-foreground mb-2">
                Requisitos de contraseña:
              </p>
              <ul className="space-y-1 text-xs">
                <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  Al menos 8 caracteres {newPassword.length >= 8 && '✓'}
                </li>
                <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  Una letra mayúscula {/[A-Z]/.test(newPassword) && '✓'}
                </li>
                <li className={`flex items-center gap-2 ${/[a-z]/.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  Una letra minúscula {/[a-z]/.test(newPassword) && '✓'}
                </li>
                <li className={`flex items-center gap-2 ${/\d/.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  Un número {/\d/.test(newPassword) && '✓'}
                </li>
                <li className={`flex items-center gap-2 ${/[!@#$%^&*]/.test(newPassword) ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <span className="w-1 h-1 rounded-full bg-current"></span>
                  Un carácter especial (!@#$%^&*) {/[!@#$%^&*]/.test(newPassword) && '✓'}
                </li>
              </ul>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 p-6 border-t border-border">
            <MaterialButton
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<Save size={18} />}
              onClick={handleSave}
            >
              Cambiar Contraseña
            </MaterialButton>
            <MaterialButton
              variant="outlined"
              color="secondary"
              onClick={onClose}
            >
              Cancelar
            </MaterialButton>
          </div>
        </div>
      </div>
    </>
  );
}
