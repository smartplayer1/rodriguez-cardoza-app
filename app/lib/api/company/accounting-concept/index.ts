
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