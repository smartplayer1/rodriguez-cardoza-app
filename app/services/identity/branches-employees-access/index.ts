import { BranchEmployeesAccess } from '@/app/type/branch-employee-access';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const getBranchesEmployeesAccess = async (
  context?: ServiceRequestContext,
): Promise<BranchEmployeesAccess[]> => {
  const res = await fetch(resolveServiceUrl('/api/identity/branches/employees-access', context), {
    headers: createJsonHeaders(context?.cookieHeader),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch branch employees access');
  }
  return res.json();
};
