
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const getAccountingConceptCategories = async () => {
const response = await fetch(resolveServiceUrl('/api/company/accounting-concept/category'), {
  method: 'GET',
  headers: createJsonHeaders()
});

if (!response.ok) {
  throw new Error('Failed to fetch accounting concept categories');
}
return await response.json();
};


export const postAccountingConcept = async (conceptData: { name: string; categoryId: number }, context?: ServiceRequestContext) => {
 return await fetch(resolveServiceUrl('/api/company/accounting-concept', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(conceptData),
  });
};

export const getAccountingConcepts = async (context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/company/accounting-concept', context), {
    method: 'GET',
    headers: createJsonHeaders(context?.cookieHeader),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch accounting concepts');
  }
  return await response.json();
};  

export const updateAccountingConcept = async (conceptData: { id: number; name: string; categoryId: number }, context?: ServiceRequestContext) => {
  return await fetch(resolveServiceUrl('/api/company/accounting-concept', context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(conceptData),
  });
};

export const deleteAccountingConcept = async (id: number, context?: ServiceRequestContext) => {
 return await fetch(resolveServiceUrl('/api/company/accounting-concept', context), {
    method: 'DELETE',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({ id }),
  });
};