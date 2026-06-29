import {
  RoleDetail,
  RoleModule,
  RoleUpdatePayload,
} from '@/app/type/user';

export const getRoles = async () => {
  const response = await fetch('/api/roles', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }

  return await response.json();
};

export const getRoleById = async (id: string): Promise<RoleDetail> => {
  const response = await fetch(`/api/roles/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch role detail');
  }

  return response.json();
};

export const getRoleModules = async (): Promise<RoleModule[]> => {
  const response = await fetch('/api/roles/modules', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
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
): Promise<RoleDetail> => {
  const response = await fetch('/api/roles', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
): Promise<RoleDetail> => {
  const response = await fetch(`/api/roles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update role');
  }

  return response.json();
};