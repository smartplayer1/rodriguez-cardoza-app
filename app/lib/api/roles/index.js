export const getRoles = async () => {
const response = await fetch('/api/roles', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
});

if (!response.ok) {
  throw new Error('Failed to fetch roles');
}
return await response.json();

};