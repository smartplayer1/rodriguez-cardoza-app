import React, { useEffect, useMemo, useState } from 'react';
import { MaterialButton } from './MaterialButton';
import { MaterialInput } from './MaterialInput';
import { Save, X, Shield, CheckSquare, Square } from 'lucide-react';
import {
  Role,
  RoleDetail,
  RoleModule,
  RoleUpdatePayload,
} from '@/app/type/user';
import { getRoleById, getRoleModules } from '@/app/services/roles';
import { CardsSkeleton } from '@/components/ui/loading-skeleton';

interface RoleDetailsProps {
  role: Role | null;
  onSave: (roleData: {
    roleName: string;
    description: string | null;
    permissions: RoleUpdatePayload['permissions'];
  }) => void | Promise<void>;
  onCancel: () => void;
}

export default function RoleDetails({ role, onSave, onCancel }: RoleDetailsProps) {
  const [roleName, setRoleName] = useState(role?.name || '');
  const [description, setDescription] = useState('');
  const [allModules, setAllModules] = useState<RoleModule[]>([]);
  const [moduleEnabled, setModuleEnabled] = useState<Record<number, boolean>>({});
  const [permissionEnabled, setPermissionEnabled] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const buildDefaultPermissionMap = (modules: RoleModule[]) => {
    const map: Record<number, boolean> = {};
    modules.forEach((moduleItem) => {
      moduleItem.modulePermission.forEach((permission) => {
        if (typeof permission.id === 'number') {
          map[permission.id] = false;
        }
      });
    });
    return map;
  };

  const buildDefaultModuleMap = (modules: RoleModule[]) => {
    const map: Record<number, boolean> = {};
    modules.forEach((moduleItem) => {
      map[moduleItem.id] = false;
    });
    return map;
  };

  const syncModuleFlags = (modules: RoleModule[], permissionState: Record<number, boolean>) => {
    const nextModuleState: Record<number, boolean> = {};

    modules.forEach((moduleItem) => {
      const permissionIds = moduleItem.modulePermission
        .map((permission) => permission.id)
        .filter((id): id is number => typeof id === 'number');

      nextModuleState[moduleItem.id] = permissionIds.some((id) => permissionState[id]);
    });

    setModuleEnabled(nextModuleState);
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const modulesData = await getRoleModules();
        if (!mounted) {
          return;
        }

        setAllModules(modulesData);
        const defaultPermissionMap = buildDefaultPermissionMap(modulesData);
        const defaultModuleMap = buildDefaultModuleMap(modulesData);

        setPermissionEnabled(defaultPermissionMap);
        setModuleEnabled(defaultModuleMap);

        if (role?.id) {
          const roleDetail: RoleDetail = await getRoleById(role.id);
          if (!mounted) {
            return;
          }

          setRoleName(roleDetail.name || role.name || '');
          setDescription(roleDetail.description || '');

          const permissionMap = { ...defaultPermissionMap };
          roleDetail.modules.forEach((moduleItem) => {
            moduleItem.modulePermission.forEach((permission) => {
              if (typeof permission.id === 'number') {
                permissionMap[permission.id] = permission.isActive;
              }
            });
          });

          setPermissionEnabled(permissionMap);
          syncModuleFlags(modulesData, permissionMap);
        }
      } catch (error) {
        console.error('Error al cargar datos del rol', error);
        if (mounted) {
          setLoadError('No se pudo cargar la configuracion de modulos y permisos');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [role]);

  const totalPermissions = useMemo(() => {
    return allModules.reduce((acc, moduleItem) => {
      const valid = moduleItem.modulePermission.filter((permission) => typeof permission.id === 'number').length;
      return acc + valid;
    }, 0);
  }, [allModules]);

  const selectedPermissionsCount = useMemo(() => {
    return Object.values(permissionEnabled).filter(Boolean).length;
  }, [permissionEnabled]);

  const togglePermission = (moduleId: number, permissionId: number) => {
    setPermissionEnabled((prev) => {
      const next = {
        ...prev,
        [permissionId]: !prev[permissionId],
      };

      const moduleDef = allModules.find((moduleItem) => moduleItem.id === moduleId);
      if (moduleDef) {
        const permissionIds = moduleDef.modulePermission
          .map((permission) => permission.id)
          .filter((id): id is number => typeof id === 'number');
        const anyEnabled = permissionIds.some((id) => next[id]);
        setModuleEnabled((prevModuleState) => ({
          ...prevModuleState,
          [moduleId]: anyEnabled,
        }));
      }

      return next;
    });
  };

  const toggleModule = (module: RoleModule) => {
    const nextEnabled = !moduleEnabled[module.id];

    setModuleEnabled((prev) => ({
      ...prev,
      [module.id]: nextEnabled,
    }));

    setPermissionEnabled((prev) => {
      const next = { ...prev };
      module.modulePermission.forEach((permission) => {
        if (typeof permission.id === 'number') {
          next[permission.id] = nextEnabled;
        }
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      alert('Por favor ingrese un nombre para el rol');
      return;
    }

    const payloadPermissions = allModules
      .flatMap((moduleItem) => {
        const moduleIsEnabled = !!moduleEnabled[moduleItem.id];

        return moduleItem.modulePermission
          .map((permission) => permission.id)
          .filter((id): id is number => typeof id === 'number')
          .map((permissionId) => ({
            permissionId,
            isActive: moduleIsEnabled ? !!permissionEnabled[permissionId] : false,
          }));
      });

    const activeCount = payloadPermissions.filter((permission) => permission.isActive).length;

    if (activeCount === 0) {
      alert('Por favor seleccione al menos un permiso');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        roleName: roleName.trim(),
        description: description.trim() || null,
        permissions: payloadPermissions,
      });
    } finally {
      setSaving(false);
    }
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

      {loadError && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

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

              <MaterialInput
                label="Descripcion"
                type="text"
                placeholder="Descripcion del rol"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                helperText="Puede dejarlo vacio si no aplica"
              />

              {/* Permissions Summary */}
              <div className="bg-muted rounded p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Permisos Seleccionados
                </p>
                <p className="text-2xl text-foreground">
                  {selectedPermissionsCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  de {totalPermissions} disponibles
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
                  disabled={saving || loading}
                >
                  {saving ? 'Guardando...' : 'Guardar Rol'}
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
            <h3 className="text-foreground mb-4">Modulos y Permisos</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Active o desactive modulos completos, o ajuste permisos individuales.
            </p>

            <div className="space-y-6">
              {loading ? (
                <CardsSkeleton count={4} className="w-full" />
              ) : allModules.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay modulos disponibles</div>
              ) : (
                allModules.map((moduleItem) => {
                const permissionIds = moduleItem.modulePermission
                  .map((permission) => permission.id)
                  .filter((id): id is number => typeof id === 'number');

                const checkedCount = permissionIds.filter((id) => permissionEnabled[id]).length;
                const isFullySelected = checkedCount > 0 && checkedCount === permissionIds.length;
                const isPartiallySelected = checkedCount > 0 && checkedCount < permissionIds.length;

                return (
                  <div key={moduleItem.id} className="border border-border rounded p-4">
                    {/* Category Header */}
                    <div 
                      className="flex items-center gap-3 mb-4 cursor-pointer hover:bg-muted 
                               p-2 rounded transition-colors"
                      onClick={() => toggleModule(moduleItem)}
                    >
                      <div className="flex items-center justify-center">
                        {moduleEnabled[moduleItem.id] && isFullySelected ? (
                          <CheckSquare size={20} className="text-primary" />
                        ) : moduleEnabled[moduleItem.id] && isPartiallySelected ? (
                          <div className="w-5 h-5 border-2 border-primary rounded flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary rounded"></div>
                          </div>
                        ) : (
                          <Square size={20} className="text-muted-foreground" />
                        )}
                      </div>
                      <h4 className="text-foreground">{moduleItem.moduleName}</h4>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {checkedCount}/{permissionIds.length}
                      </span>
                    </div>

                    {/* Permissions in Category */}
                    <div className="space-y-2 pl-8">
                      {moduleItem.modulePermission.map((permission, index) => {
                        const permissionId = permission.id;
                        const isSelected = typeof permissionId === 'number' && permissionEnabled[permissionId];

                        return (
                          <div
                            key={permissionId ?? `${moduleItem.id}-${index}`}
                            className="flex items-start gap-3 p-2 rounded hover:bg-muted 
                                     transition-colors cursor-pointer"
                            onClick={() => {
                              if (typeof permissionId === 'number') {
                                togglePermission(moduleItem.id, permissionId);
                              }
                            }}
                          >
                            <div className="flex items-center justify-center mt-1">
                              {isSelected ? (
                                <CheckSquare size={18} className="text-primary" />
                              ) : (
                                <Square size={18} className="text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{permission.permissionNameInSpanish}</p>
                              <p className="text-xs text-muted-foreground">
                                {permission.descriptionInSpanish  || 'Sin descripcion'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
