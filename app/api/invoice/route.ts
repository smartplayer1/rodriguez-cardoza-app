import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";
import {
  InvoiceBatchPostResponse,
  ServerInvoicePayload,
  ServerInvoiceResponse,
} from "@/app/type/invoice";

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
