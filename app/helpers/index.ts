export const hasPermission = (userPermissions: string[], permission?: string) => {
  if (!permission) return true;
  return userPermissions.includes(permission);
};