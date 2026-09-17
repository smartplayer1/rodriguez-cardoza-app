import { Branch, BranchResponse, GetBranchesFilters, RecordsBranch, UpdateBranchPayload } from '@/app/type/branch';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

const readServiceErrorMessage = async (response: Response, fallback: string) => {
    const errorBody = await response.json().catch(() => null);
    return (
        (errorBody as { error?: string; message?: string; detail?: string } | null)?.error ||
        (errorBody as { error?: string; message?: string; detail?: string } | null)?.message ||
        (errorBody as { error?: string; message?: string; detail?: string } | null)?.detail ||
        fallback
    );
};

const buildQueryString = (filters?: GetBranchesFilters) => {
    if (!filters) {
        return '';
    }

    const params = new URLSearchParams();

    if (typeof filters.id === 'number') params.set('id', String(filters.id));
    if (filters.code?.trim()) params.set('code', filters.code.trim());
    if (filters.name?.trim()) params.set('name', filters.name.trim());
    if (filters.address?.trim()) params.set('address', filters.address.trim());
    if (typeof filters.page === 'number' && filters.page > 0) params.set('Page', String(filters.page));
    if (typeof filters.perPage === 'number' && filters.perPage > 0) params.set('PerPage', String(filters.perPage));
    if (typeof filters.skip === 'number' && filters.skip > 0) params.set('Skip', String(filters.skip));

    const query = params.toString();
    return query ? `?${query}` : '';
};

export const getBranches = async (filters?: GetBranchesFilters): Promise<BranchResponse> => {
    const res = await fetch(
        resolveServiceUrl(`/api/company/branch${buildQueryString(filters)}`, {
            baseUrl: filters?.baseUrl,
            cookieHeader: filters?.cookieHeader,
        }),
        {
            headers: createJsonHeaders(filters?.cookieHeader),
            cache: 'no-store',
        },
    );
    if (!res.ok) {
        throw new Error(await readServiceErrorMessage(res, 'Failed to fetch branches'));
    }
    return res.json();
};

export const getBranchById = async (
    id: number,
    context?: ServiceRequestContext,
): Promise<RecordsBranch> => {
    const res = await fetch(resolveServiceUrl(`/api/company/branch/${id}`, context), {
        headers: createJsonHeaders(context?.cookieHeader),
        cache: 'no-store',
    });
    if (!res.ok) {
        throw new Error(await readServiceErrorMessage(res, 'Failed to fetch branch'));
    }
    return res.json();
};

export const createBranch = async (
    branchData: Branch,
    context?: ServiceRequestContext,
): Promise<RecordsBranch> => {
    const res = await fetch(resolveServiceUrl('/api/company/branch', context), {
        method: 'POST',
        headers: createJsonHeaders(context?.cookieHeader),
        body: JSON.stringify(branchData),
    });
    if (!res.ok) {
        throw new Error(await readServiceErrorMessage(res, 'Failed to create branch'));
    }
    return res.json();
};

export const updateBranch = async (
    id: number,
    branchData: UpdateBranchPayload,
    context?: ServiceRequestContext,
): Promise<void> => {
    const res = await fetch(resolveServiceUrl(`/api/company/branch/${id}`, context), {
        method: 'PUT',
        headers: createJsonHeaders(context?.cookieHeader),
        body: JSON.stringify(branchData),
    });
    if (!res.ok) {
        throw new Error(await readServiceErrorMessage(res, 'Failed to update branch'));
    }
};

export const deleteBranch = async (
    branchId: number,
    context?: ServiceRequestContext,
): Promise<void> => {
    const res = await fetch(resolveServiceUrl(`/api/company/branch/${branchId}`, context), {
        method: 'DELETE',
        headers: createJsonHeaders(context?.cookieHeader),
    });
    if (!res.ok) {
        throw new Error(await readServiceErrorMessage(res, 'Failed to delete branch'));
    }
};
