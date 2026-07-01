export type ServiceRequestContext = {
  baseUrl?: string;
  cookieHeader?: string;
};

const localBaseUrl = process.env.NEXT_PUBLIC_URL_LOCAL?.replace(/\/$/, '');

export const resolveServiceUrl = (path: string, context?: ServiceRequestContext) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = (context?.baseUrl || localBaseUrl || '').replace(/\/$/, '');

  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
};

export const createJsonHeaders = (cookieHeader?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  return headers;
};