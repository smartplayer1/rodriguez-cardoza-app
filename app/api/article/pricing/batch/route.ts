import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== "object") {
    return "Error al importar los precios";
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || "Error al importar los precios";
};

// POST /v1/article/pricing/batch: mejor esfuerzo (no todo-o-nada) — siempre
// responde 200 con un resultado por fila, así que este proxy solo reenvía
// el body y la respuesta tal cual, sin reinterpretar éxito/error por status.
export async function POST(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/article/pricing/batch`, {
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
    console.error("Error importing article pricing batch:", error);
    return NextResponse.json({ error: "Failed to import article pricing batch" }, { status: 500 });
  }
}
