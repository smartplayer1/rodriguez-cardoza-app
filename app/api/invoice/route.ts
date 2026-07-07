import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";
import {
  InvoiceGetFilters,
  InvoiceBatchPostResponse,
  InvoiceListResponse,
  ServerInvoicePayload,
  ServerInvoiceResponse,
  ServerInvoiceUpdatePayload,
} from "@/app/type/invoice";

const buildQueryString = (filters: InvoiceGetFilters) => {
  const params = new URLSearchParams();

  if (filters.document?.trim()) params.set("document", filters.document.trim());
  if (filters.chargeStatus?.trim()) params.set("chargeStatus", filters.chargeStatus.trim());
  if (filters.clientCode?.trim()) params.set("clientCode", filters.clientCode.trim());
  if (filters.branchCode?.trim()) params.set("branchCode", filters.branchCode.trim());
  if (filters.issuedAt?.trim()) params.set("issuedAt", filters.issuedAt.trim());
  if (typeof filters.page === 'number' && filters.page > 0) params.set('Page', String(filters.page));
  if (typeof filters.perPage === 'number' && filters.perPage > 0) params.set('PerPage', String(filters.perPage));

  const query = params.toString();
  return query ? `?${query}` : "";
};

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== "object") {
    return "Error al crear la factura";
  }

  const errorBody = body as {
    detail?: string;
    message?: string;
    error?: string;
  };

  return errorBody.detail || errorBody.message || errorBody.error || "Error al crear la factura";
};

const sendInvoice = async (token: string, invoice: ServerInvoicePayload) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(invoice),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      document: invoice.header.document,
      invoice: null,
      error: responseBody,
      message: readErrorMessage(responseBody),
    };
  }

  return {
    ok: true,
    status: response.status,
    document: invoice.header.document,
    invoice: responseBody as ServerInvoiceResponse,
    error: null,
    message: null,
  };
};

export async function GET(request: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const requestUrl = new URL(request.url);

    const filters: InvoiceGetFilters = {
      document: requestUrl.searchParams.get("document") ?? undefined,
      chargeStatus: requestUrl.searchParams.get("chargeStatus") ?? undefined,
      clientCode: requestUrl.searchParams.get("clientCode") ?? undefined,
      branchCode: requestUrl.searchParams.get("branchCode") ?? undefined,
      issuedAt: requestUrl.searchParams.get("issuedAt") ?? undefined,
      page: Number(requestUrl.searchParams.get('Page') ?? requestUrl.searchParams.get('page') ?? '') || undefined,
      perPage: Number(requestUrl.searchParams.get('PerPage') ?? requestUrl.searchParams.get('perPage') ?? '') || undefined,
    };

    const query = buildQueryString(filters);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/invoice${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          message: readErrorMessage(responseBody),
          error: responseBody,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(responseBody as InvoiceListResponse);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const invoices: ServerInvoicePayload[] = Array.isArray(body) ? body : [body];

    if (invoices.length === 0) {
      return NextResponse.json({ error: "No invoices to process" }, { status: 400 });
    }

    if (invoices.length === 1) {
      const result = await sendInvoice(token, invoices[0]);

      if (!result.ok) {
        return NextResponse.json(
          {
            message: result.message,
            document: result.document,
            error: result.error,
          },
          { status: result.status }
        );
      }

      const singleSuccessResponse: InvoiceBatchPostResponse = {
        message: "Invoices processed successfully",
        total: 1,
        success: 1,
        failed: 0,
        results: [result],
      };

      return NextResponse.json(singleSuccessResponse, { status: 201 });
    }

    const results = await Promise.all(invoices.map((invoice) => sendInvoice(token, invoice)));

    const failed = results.filter((result) => !result.ok);

    if (failed.length > 0) {
      if (failed.length === results.length) {
        return NextResponse.json(
          {
            message: failed[0]?.message || "No invoices were processed successfully",
            total: results.length,
            failed: failed.length,
            success: 0,
            results,
          },
          { status: failed[0]?.status || 400 }
        );
      }

      const partialResponse: InvoiceBatchPostResponse = {
        message: "Some invoices failed to process",
        total: results.length,
        failed: failed.length,
        success: results.length - failed.length,
        results,
      };

      return NextResponse.json(
        partialResponse,
        { status: 207 }
      );
    }

    const successResponse: InvoiceBatchPostResponse = {
      message: "Invoices processed successfully",
      total: results.length,
      success: results.length,
      failed: 0,
      results,
    };

    return NextResponse.json(
      successResponse,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invoices:", error);
    return NextResponse.json({ error: "Failed to create invoices" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as ServerInvoiceUpdatePayload;

    if (!body?.header?.id) {
      return NextResponse.json({ message: 'Invoice id is required' }, { status: 400 });
    }
console.log('Request body for updating invoice:', body);
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/invoice/${body.header.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Response from API for updating invoice:', response);
    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          message: readErrorMessage(responseBody),
          error: responseBody,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
