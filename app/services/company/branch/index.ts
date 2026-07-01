import { Branch } from '@/app/type/branch';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const getBranches = async (context?: ServiceRequestContext) => {
    const res = await fetch(resolveServiceUrl('/api/company/branch', context), {
        headers: createJsonHeaders(context?.cookieHeader)
    });
    if (!res.ok) {
        throw new Error('Failed to fetch branches');
    }
    return res.json();
}

export const createBranch = async (branchData: Branch, context?: ServiceRequestContext) => {
    const res = await fetch(resolveServiceUrl('/api/company/branch', context), {
        method: 'POST',
        headers: createJsonHeaders(context?.cookieHeader),
        body: JSON.stringify(branchData)
    });
    if (!res.ok) {
        throw new Error('Failed to create branch');
    }
    return res.json();
}

export const updateBranch = async (branchData: Branch, context?: ServiceRequestContext) => {
    const res = await fetch(resolveServiceUrl('/api/company/branch', context), {
        method: 'PUT',
        headers: createJsonHeaders(context?.cookieHeader),
        body: JSON.stringify(branchData)
    });
    if (!res.ok) {
        throw new Error('Failed to update branch');
    }

    return res.json();
}

export const deleteBranch = async (branchId: number, context?: ServiceRequestContext) => {
    const res = await fetch(resolveServiceUrl('/api/company/branch', context), {
        method: 'DELETE',
        headers: createJsonHeaders(context?.cookieHeader),
        body: JSON.stringify({ id: branchId })
    });
    if (!res.ok) {        throw new Error('Failed to delete branch');
    }
    return res.json();
}