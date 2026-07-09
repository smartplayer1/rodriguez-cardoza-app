import { headers } from "next/headers";

import FacturacionClient from "./FacturacionClient";
import type { ClientSearchItem } from "../cobros/client-selector";
import { getInvoices } from "@/app/services/invoice";
import { getclients } from "@/app/services/clients";
import { getBranches } from "@/app/services/company/branch";
import { InvoiceListResponse } from "@/app/type/invoice";
import type { ClienteResponse } from "@/app/type/client";
import type { BranchResponse } from "@/app/type/branch";

type BranchOption = {
  code: string;
  label: string;
};

type SearchParams = {
  document?: string | string[];
  chargeStatus?: string | string[];
  clientCode?: string | string[];
  branchCode?: string | string[];
  issuedAt?: string | string[];
  Page?: string | string[];
  PerPage?: string | string[];
};

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;

const toStringValue = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue ?? "";
};

const toPositiveInt = (
  value: string | string[] | undefined,
  fallback: number,
) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default async function FacturacionPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const page = toPositiveInt(resolvedSearchParams.Page, DEFAULT_PAGE);
  const perPage = toPositiveInt(resolvedSearchParams.PerPage, DEFAULT_PER_PAGE);
  const document = toStringValue(resolvedSearchParams.document);
  const chargeStatus = toStringValue(resolvedSearchParams.chargeStatus);
  const clientCode = toStringValue(resolvedSearchParams.clientCode);
  const branchCode = toStringValue(resolvedSearchParams.branchCode);
  const issuedAt = toStringValue(resolvedSearchParams.issuedAt);

  const requestHeaders = await headers();
  const cookieHeader = requestHeaders.get("cookie") ?? undefined;
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const baseUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_URL_LOCAL;

  let response: InvoiceListResponse;
  let fetchError: string | null = null;
  let clientOptions: ClientSearchItem[] = [];
  let branchOptions: BranchOption[] = [];

  const [clientsResult, branchesResult] = await Promise.allSettled([
    getclients({ baseUrl, cookieHeader }),
    getBranches({ baseUrl, cookieHeader }),
  ]);

  if (clientsResult.status === "fulfilled") {
    clientOptions = (
      (clientsResult.value.records || []) as ClienteResponse[]
    ).map((client) => ({
      code: client.code,
      name: client.name,
    }));
  }

  if (branchesResult.status === "fulfilled") {
    branchOptions = (
      (branchesResult.value as BranchResponse).records || []
    ).map((branch) => ({
      code: branch.code,
      label: `${branch.code} - ${branch.name}`,
    }));
  }

  try {
    response = await getInvoices({
      document: document || undefined,
      chargeStatus: chargeStatus || undefined,
      clientCode: clientCode || undefined,
      branchCode: branchCode || undefined,
      issuedAt: issuedAt || undefined,
      page,
      perPage,
      baseUrl,
      cookieHeader,
    });
  } catch (error) {
    fetchError =
      error instanceof Error
        ? error.message
        : "No se pudieron consultar las facturas";
    response = {
      records: [],
      paging: {
        perPage,
        currentPage: page,
        totalRecords: 0,
        totalPages: 1,
      },
    };
  }

  return (
    <FacturacionClient
      initialRecords={response.records || []}
      initialPaging={response.paging}
      initialFilters={{
        document,
        chargeStatus,
        clientCode,
        branchCode,
        issuedAt,
        page,
        perPage,
      }}
      initialError={fetchError}
      clientOptions={clientOptions}
      branchOptions={branchOptions}
    />
  );
}
