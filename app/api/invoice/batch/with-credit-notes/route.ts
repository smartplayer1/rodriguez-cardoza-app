import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";
import { postJsonWithoutTimeout } from "@/app/lib/long-request";

// node:http/https (long-request) requiere el runtime de Node.
export const runtime = "nodejs";

const readErrorMessage =(body: unknown) => {
  if (!body || typeof body !== "object") {
    return "Error al importar facturas y notas de crédito";
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return (
    errorBody.detail ||
    errorBody.message ||
    errorBody.error ||
    "Error al importar facturas y notas de crédito"
  );
};

// POST /v1/invoice/batch/with-credit-notes: facturas y notas de crédito en una
// sola transacción (todo o nada). Body { invoices, creditNotes }. El proxy
// reenvía status y body del backend tal cual; en error agrega `message`.
export async function POST(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Sin el límite de 5 min de fetch en Node: un archivo grande puede tardar
    // más en guardarse (ver app/lib/long-request.ts).
    const response = await postJsonWithoutTimeout(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/invoice/batch/with-credit-notes`,
      body,
      { Authorization: `Bearer ${token}` },
    );

    const responseBody = response.body;

    if (!response.ok) {
      return NextResponse.json(
        {
          ...(responseBody && typeof responseBody === "object" ? responseBody : {}),
          message: readErrorMessage(responseBody),
        },
        { status: response.status },
      );
    }

    return NextResponse.json(responseBody, { status: response.status });
  } catch (error) {
    console.error("Error importing invoices with credit notes:", error);
    return NextResponse.json(
      { error: "Failed to import invoices with credit notes" },
      { status: 500 },
    );
  }
}
