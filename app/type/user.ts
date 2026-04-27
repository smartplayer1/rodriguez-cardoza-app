export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}




export interface JwtDecoded {
  // Claims estándar
  aud: string;
  iss: string;
  exp: number;
  nbf: number;

  // Claims de Microsoft Identity
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": string;
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string;

  // Puede venir como string o array
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role":
    | string
    | string[];

  // Tu claim personalizado
  PermissionClaim: string[];
}

export interface CreateUserDto {
  name: string;
  lastName: string;
  userName: string | null;
  email: string | null;
  password: string;
  roleId: string;
}

export interface UpdateUserDto {
  id: string;
  name: string | null;
  lastName: string | null;
  userName: string | null;
  email: string | null;
  roleId: string;
}

export  interface UserFormData {
    firstName: string;
    lastName: string;
    username: string;
    password: string;
    email: string;
    role: string;
    roleId: string;
    [key: string]: unknown; // To allow extra fields if needed
  }

export interface RolesResponse {
id: string;
name: string; 
permissions: number[];

} 


export interface Role {
  id: string;
  name: string;
  permissions: number;
  users: number;
  createdAt: string; // puedes usar Date si lo parseas
}

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string | null;
  userName: string | null;
  role: Role;
  isArchived: boolean;
  createdAt: string; // o Date
  updatedAt: string | null; // o Date | null
}