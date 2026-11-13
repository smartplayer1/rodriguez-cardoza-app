import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== "object") {
    return "Error al consultar el histórico del cliente";
  }

  const errorBody = body as { detail?: string; message?: string };
  return errorBody.detail || errorBody.message || "Error al consultar el histórico del cliente";
};

// GET /v1/client/{code}/history?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { code } = await params;
  const queryString = new URL(req.url).searchParams.toString();

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/client/${encodeURIComponent(code)}/history${
        queryString ? `?${queryString}` : ""
      }`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { message: readErrorMessage(responseBody), error: responseBody },
        { status: response.status },
      );
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("Error fetching client history:", error);
    return NextResponse.json(
      { message: "No se pudo consultar el histórico del cliente" },
      { status: 500 },
    );
  }
}
