import { AuthUser, JwtDecoded,  } from '@/app/type/user';
export const mapUserFromToken = (decoded: JwtDecoded ): AuthUser => {
  const rolesRaw =
    decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  return {
    id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],

    name: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],

    email: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],

    roles: Array.isArray(rolesRaw)
      ? rolesRaw
      : rolesRaw
      ? [rolesRaw]
      : [],

    permissions: decoded.PermissionClaim ?? []
  };
};

export const isJwtDecoded = (obj: unknown): obj is JwtDecoded => {
  if (typeof obj !== 'object' || obj === null) return false;

  const o = obj as Record<string, unknown>;

  return (
    typeof o["PermissionClaim"] !== 'undefined' &&
    Array.isArray(o["PermissionClaim"]) &&
    typeof o["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] === 'string'
  );
};