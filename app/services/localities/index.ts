import { LocalityDepartment } from '@/app/type/locality';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const getDepartments = async (
    context?: ServiceRequestContext,
): Promise<LocalityDepartment[]> => {
    const res = await fetch(resolveServiceUrl('/api/localities/department', context), {
        headers: createJsonHeaders(context?.cookieHeader),
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error('Failed to fetch departments');
    }

    return res.json();
};
