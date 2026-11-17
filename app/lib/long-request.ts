import http from 'node:http';
import https from 'node:https';

export type LongRequestResult = {
  status: number;
  ok: boolean;
  body: unknown;
};

/**
 * POST JSON al backend sin el límite de 5 minutos que tiene `fetch` en Node
 * (HeadersTimeoutError / UND_ERR_HEADERS_TIMEOUT). Para procesos largos como
 * el recálculo de recompensas, que pueden tardar más en responder.
 * Usar solo en Route Handlers (runtime de Node).
 */
export const postJsonWithoutTimeout = (
  url: string,
  payload: unknown,
  headers: Record<string, string>,
): Promise<LongRequestResult> =>
  new Promise((resolve, reject) => {
    const target = new URL(url);
    const client = target.protocol === 'https:' ? https : http;
    const data = JSON.stringify(payload ?? {});

    const request = client.request(
      target,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        // 0 = sin límite de espera por la respuesta del backend.
        timeout: 0,
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let body: unknown = null;
          try {
            body = text ? JSON.parse(text) : null;
          } catch {
            body = text || null;
          }
          const status = response.statusCode ?? 500;
          resolve({ status, ok: status >= 200 && status < 300, body });
        });
        response.on('error', reject);
      },
    );

    request.on('error', reject);
    request.write(data);
    request.end();
  });
