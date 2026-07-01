import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';
import { JobRolePayload, JobRoleResponse } from '@/app/type/job-role';

export const getJobRoles = async (context?: ServiceRequestContext): Promise<JobRoleResponse> => {
  const response = await fetch(resolveServiceUrl('/api/company/job-role', context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.error || 'Failed to fetch job roles');
  }

  return response.json();
};

export const createJobRole = async (payload: JobRolePayload, context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/company/job-role', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.error || 'Failed to create job role');
  }

  return response.json();
};

export const updateJobRole = async (payload: JobRolePayload, context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/company/job-role', context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.error || 'Failed to update job role');
  }

  return response.json();
};

export const deleteJobRole = async (id: number, context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/company/job-role', context), {
    method: 'DELETE',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || errorData?.error || 'Failed to delete job role');
  }

  return response.json();
};
