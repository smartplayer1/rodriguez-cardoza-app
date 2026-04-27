export function getBank() {
  return fetch('/api/bank', {
    method: 'GET',
    credentials: 'include', // 🔥 importante
    headers: {
      'Content-Type': 'application/json'
    }
  });
}