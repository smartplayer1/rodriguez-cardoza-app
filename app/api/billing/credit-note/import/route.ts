import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== "object") {
    return "Error al importar las notas de crédito";
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return (
    errorBody.detail || errorBody.message || errorBody.error || "Error al importar las notas de crédito"
  );
};

// POST /v1/billing/credit-note/import: crea notas de crédito desde el archivo
// Excel, sin relacionarlas a una factura. Body: { creditNotes: [...] }.
export async function POST(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/billing/credit-note/import`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          message: readErrorMessage(responseBody),
          error: responseBody,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(responseBody, { status: response.status });
  } catch (error) {
    console.error("Error importing credit notes:", error);
    return NextResponse.json({ error: "Failed to import credit notes" }, { status: 500 });
  }
}
