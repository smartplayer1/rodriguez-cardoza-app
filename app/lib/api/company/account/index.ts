import { AccountData } from "@/app/type/bank";

export const getBankAccounts = async () => {
const response = await fetch('/api/company/bank-accounts', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
});

if (!response.ok) {
  throw new Error('Failed to fetch bank accounts');
}
return await response.json();

};

export const createBankAccount = async (accountData: { bankId: number; accountNumber: string; description: string }) => {
  const response = await fetch('/api/company/bank-accounts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  });
  if (!response.ok) {
    throw new Error('Failed to create bank account');
  }
  return await response.json();
};


export const updateBankAccount = async (accountData: AccountData) => {
  return await fetch(`/api/company/bank-accounts`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(accountData),
  });
};

export const deleteBankAccount = async (id: number) => {
 return await fetch(`/api/company/bank-accounts`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });
};
