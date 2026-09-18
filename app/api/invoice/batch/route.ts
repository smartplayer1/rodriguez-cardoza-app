import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== "object") {
    return "Error al crear el lote de facturas";
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || "Error al crear el lote de facturas";
};

// POST /v1/invoice/batch: todo o nada — si una sola factura del lote falla,
// el backend no crea ninguna y devuelve un único error señalando cuál y por
// qué. Este proxy solo reenvía esa respuesta tal cual, sin intentar
// reconciliar resultados parciales (no los hay).
export async function POST(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/invoice/batch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

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
    console.error("Error creating invoice batch:", error);
    return NextResponse.json({ error: "Failed to create invoice batch" }, { status: 500 });
  }
}
