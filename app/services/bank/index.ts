import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const getBank = async (context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/bank', context), {
  method: 'GET',
  headers: createJsonHeaders(context?.cookieHeader)
  });

if (!response.ok) {
  throw new Error('Failed to fetch banks');
}
return await response.json();

};

export const createBank = async (bankData: { name: string; acronymus: string }, context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/bank', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(bankData),
  });

  if (!response.ok) {
    throw new Error('Failed to create bank');
  }

  return await response.json();
};

export const updateBank = async (bankId: number, bankData: { name: string; acronymus: string }, context?: ServiceRequestContext) => {
  return await fetch(resolveServiceUrl('/api/bank', context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({id: bankId, ...bankData }),
  });
};


export const deleteBank = async (bankId: number, context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/bank', context), {
    method: 'DELETE',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({ id: bankId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete bank');
  }

  return await response.json();
};