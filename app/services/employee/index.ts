import { EmployeeFilters, EmployeeListResponse } from '@/app/type/employee';
import { createJsonHeaders, resolveServiceUrl } from '@/app/services/http';

const buildQueryString = (filters?: Omit<EmployeeFilters, 'baseUrl'>) => {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();

  if (filters.code?.trim()) params.set('code', filters.code.trim());
  if (filters.name?.trim()) params.set('name', filters.name.trim());
  if (filters.middleName?.trim()) params.set('middleName', filters.middleName.trim());
  if (filters.LastName?.trim()) params.set('LastName', filters.LastName.trim());
  if (filters.SecondLastName?.trim()) params.set('SecondLastName', filters.SecondLastName.trim());
  if (filters.phoneNumber?.trim()) params.set('phoneNumber', filters.phoneNumber.trim());
  if (filters.jobRoleId?.trim()) params.set('jobRoleId', filters.jobRoleId.trim());
  if (filters.branchId?.trim()) params.set('branchId', filters.branchId.trim());

  if (typeof filters.page === 'number' && filters.page > 0) {
    params.set('Page', String(filters.page));
  }

  if (typeof filters.perPage === 'number' && filters.perPage > 0) {
    params.set('PerPage', String(filters.perPage));
  }

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const getEmployees = async (
  filters?: EmployeeFilters,
): Promise<EmployeeListResponse> => {
  const queryString = buildQueryString(filters);
  const endpoint = resolveServiceUrl(`/api/employee${queryString}`, {
    baseUrl: filters?.baseUrl,
  });

  const headers = createJsonHeaders(filters?.cookieHeader);

  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });


  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const errorMessage =
      (errorBody as { message?: string; detail?: string } | null)?.message ||
      (errorBody as { message?: string; detail?: string } | null)?.detail ||
      'Failed to fetch employees';

    throw new Error(errorMessage);
  }

  return response.json();
};