import { Branch } from '@/app/type/branch';
export const getBranches = async () => {
    const res = await fetch('/api/company/branch');
    if (!res.ok) {
        throw new Error('Failed to fetch branches');
    }
    return res.json();
}

export const createBranch = async (branchData: Branch) => {
    const res = await fetch('/api/company/branch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(branchData)
    });
    if (!res.ok) {
        throw new Error('Failed to create branch');
    }
    return res.json();
}

export const updateBranch = async (branchData: Branch) => {
    const res = await fetch(`/api/company/branch/${branchData.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(branchData)
    });
    if (!res.ok) {
        throw new Error('Failed to update branch');
    }

    return res.json();
}

export const deleteBranch = async (branchId: number) => {
    const res = await fetch(`/api/company/branch`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: branchId })
    });
    if (!res.ok) {        throw new Error('Failed to delete branch');
    }
    return res.json();
}