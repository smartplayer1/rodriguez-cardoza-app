
export const getAccountingConceptCategories = async () => {
const response = await fetch('/api/company/accounting-concept/category', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
});

if (!response.ok) {
  throw new Error('Failed to fetch accounting concept categories');
}
return await response.json();
};


export const postAccountingConcept = async (conceptData: { name: string; categoryId: number }) => {
 return await fetch('/api/company/accounting-concept', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(conceptData),
  });
};

export const getAccountingConcepts = async () => {
  const response = await fetch('/api/company/accounting-concept', {
    method: 'GET',});
  if (!response.ok) {
    throw new Error('Failed to fetch accounting concepts');
  }
  return await response.json();
};  

export const updateAccountingConcept = async (conceptData: { id: number; name: string; categoryId: number }) => {
  return await fetch(`/api/company/accounting-concept`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(conceptData),
  });
};

export const deleteAccountingConcept = async (id: number) => {
 return await fetch(`/api/company/accounting-concept`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });
};