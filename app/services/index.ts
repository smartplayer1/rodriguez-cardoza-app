
import { createJsonHeaders, resolveServiceUrl } from '@/app/services/http';

export async function loginRequest({ credential, password }: { credential: string; password: string }) {
return await fetch(resolveServiceUrl('/api/login'), {
  method: 'POST',
  credentials: 'include', // 🔥 importante
  headers: createJsonHeaders(),
  body: JSON.stringify({ credential, password })
});
}


