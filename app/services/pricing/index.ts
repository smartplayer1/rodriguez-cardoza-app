import {
  ArticlePricingBatchRequest,
  ArticlePricingBatchResult,
  ArticlePricingBatchRow,
  ArticlePricingPeriod,
  PriceCategoryResponse,
} from "@/app/type/pricing";
import { createJsonHeaders, resolveServiceUrl, ServiceRequestContext } from "@/app/services/http";

const readServiceErrorMessage = async (response: Response, fallback: string) => {
  const errorBody = await response.json().catch(() => null);
  return (
    (errorBody as { error?: string; message?: string; detail?: string } | null)?.error ||
    (errorBody as { error?: string; message?: string; detail?: string } | null)?.message ||
    (errorBody as { error?: string; message?: string; detail?: string } | null)?.detail ||
    fallback
  );
};

export const getPriceCategories = async (
  context?: ServiceRequestContext,
): Promise<PriceCategoryResponse> => {
  const response = await fetch(resolveServiceUrl("/api/price-category", context), {
    headers: createJsonHeaders(context?.cookieHeader),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readServiceErrorMessage(response, "No se pudieron cargar las categorías de precio"));
  }

  return response.json();
};

export const importArticlePricingBatch = async (
  period: ArticlePricingPeriod,
  rows: ArticlePricingBatchRow[],
  context?: ServiceRequestContext,
): Promise<ArticlePricingBatchResult[]> => {
  const payload: ArticlePricingBatchRequest = { year: period.year, month: period.month, rows };

  const response = await fetch(resolveServiceUrl("/api/article/pricing/batch", context), {
    method: "POST",
    headers: createJsonHeaders(context?.cookieHeader),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readServiceErrorMessage(response, "No se pudo importar el lote de precios"));
  }

  return response.json();
};
