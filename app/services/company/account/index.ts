import { AccountData } from "@/app/type/bank";
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const getBankAccounts = async (context?: ServiceRequestContext) => {
const response = await fetch(resolveServiceUrl('/api/company/bank-accounts', context), {
  method: 'GET',
  headers: createJsonHeaders(context?.cookieHeader)
});

if (!response.ok) {
  throw new Error('Failed to fetch bank accounts');
}
return await response.json();
};

export const createBankAccount = async (accountData: { bankId: number; accountNumber: string; description: string }, context?: ServiceRequestContext) => {
  const response = await fetch(resolveServiceUrl('/api/company/bank-accounts', context), {
    method: 'POST',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(accountData),
  });
  if (!response.ok) {
    throw new Error('Failed to create bank account');
  }
  return await response.json();
};


export const updateBankAccount = async (accountData: AccountData, context?: ServiceRequestContext) => {
  return await fetch(resolveServiceUrl('/api/company/bank-accounts', context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(accountData),
  });
};

export const deleteBankAccount = async (id: number, context?: ServiceRequestContext) => {
 return await fetch(resolveServiceUrl('/api/company/bank-accounts', context), {
    method: 'DELETE',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({ id }),
  });
};
