import { Client } from "@/app/type/client";
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

export const getclients = async (context?: ServiceRequestContext) => {
  const res = await fetch(resolveServiceUrl('/api/clients', context), {
    headers: createJsonHeaders(context?.cookieHeader),
  });
  if (!res.ok) {
    throw new Error("Failed to fetch clients");
  }
  return res.json();
};

export const createClient = async (clientData: Client, context?: ServiceRequestContext) => {
  return await fetch(resolveServiceUrl('/api/clients', context), {
    method: "POST",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(clientData),
  });
};

export const updateClient = async (clientData: Client, context?: ServiceRequestContext) => {
  const res = await fetch(resolveServiceUrl(`/api/clients/${clientData.id}`, context), {
    method: "PUT",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(clientData),
  });
  if (!res.ok) {
    throw new Error("Failed to update client");
  }
  return res.json();
};

export const deleteClient = async (clientId: string, context?: ServiceRequestContext) => {
  const res = await fetch(resolveServiceUrl(`/api/clients/${clientId}`, context), {
    method: "DELETE",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify({ id: clientId }),
  });
  if (!res.ok) {
    throw new Error("Failed to delete client");
  }
  return res.json();
};
