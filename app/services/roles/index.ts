import {
  RoleDetail,
  RoleModule,
  RoleUpdatePayload,
} from '@/app/type/user';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const getRoles = async (context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/roles', context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }

  return await response.json();
};

export const getRoleById = async (id: string, context?: ServiceRequestContext): Promise<RoleDetail> => {
  const response = await fetch(resolveServiceUrl(`/api/roles/${id}`, context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch role detail');
  }

  return response.json();
};

export const getRoleModules = async (context?: ServiceRequestContext): Promise<RoleModule[]> => {
  const response = await fetch(resolveServiceUrl('/api/roles/modules', context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch role modules');
  }

  const data = await response.json();
  const records = Array.isArray(data) ? data: [];

  if (records.length > 0 && Array.isArray(records)) {
    return records as RoleModule[];
  }

  return records as RoleModule[];
};

export const createRole = async (
  payload: RoleUpdatePayload,
  context?: ServiceRequestContext,
): Promise<RoleDetail> => {
  const response = await fetch(resolveServiceUrl('/api/roles', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create role');
  }

  return response.json();
};

export const updateRole = async (
  id: string,
  payload: RoleUpdatePayload,
  context?: ServiceRequestContext,
): Promise<RoleDetail> => {
  const response = await fetch(resolveServiceUrl(`/api/roles/${id}`, context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update role');
  }

  return response.json();
};