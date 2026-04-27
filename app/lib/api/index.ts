
export async function loginRequest({ credential, password }: { credential: string; password: string }) {
return await fetch('/api/login', {
  method: 'POST',
  credentials: 'include', // 🔥 importante
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ credential, password })
});
}