import { ClientEarnedReward, UpdateEarnedRewardPayload } from '@/app/type/client';
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from '@/app/services/http';

const extractErrorMessage = async (response: Response, fallback: string) => {
  const errorBody = await response.json().catch(() => null);
  return (
    (errorBody as { message?: string; detail?: string } | null)?.message ||
    (errorBody as { message?: string; detail?: string } | null)?.detail ||
    fallback
  );
};

export const updateEarnedReward = async (
  id: number,
  payload: UpdateEarnedRewardPayload,
  context?: ServiceRequestContext,
): Promise<ClientEarnedReward> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/earned-reward/${id}`, context), {
    method: 'PUT',
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'No se pudo editar el premio ganado'));
  }

  return response.json();
};

export const deleteEarnedReward = async (
  id: number,
  context?: ServiceRequestContext,
): Promise<void> => {
  const response = await fetch(resolveServiceUrl(`/api/reward/earned-reward/${id}`, context), {
    method: 'DELETE',
    headers: createJsonHeaders(context?.cookieHeader),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response, 'No se pudo eliminar el premio ganado'));
  }
};
