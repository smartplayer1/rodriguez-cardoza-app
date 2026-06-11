export const getBank = async () => {
  const response = await fetch('/api/bank', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
  });

if (!response.ok) {
  throw new Error('Failed to fetch banks');
}
return await response.json();

};

export const createBank = async (bankData: { name: string; acronymus: string }) => {
  const response = await fetch('/api/bank', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bankData),
  });

  if (!response.ok) {
    throw new Error('Failed to create bank');
  }

  return await response.json();
};

export const updateBank = async (bankId: number, bankData: { name: string; acronymus: string }) => {
  return await fetch(`/api/bank`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({id: bankId, ...bankData }),
  });
};


export const deleteBank = async (bankId: number) => {
  const response = await fetch(`/api/bank`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: bankId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete bank');
  }

  return await response.json();
};