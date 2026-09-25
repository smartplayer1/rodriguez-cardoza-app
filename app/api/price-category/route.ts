import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== "object") {
    return "Error al obtener categorías de precio";
  }

  const errorBody = body as { detail?: string; message?: string; error?: string };
  return errorBody.detail || errorBody.message || errorBody.error || "Error al obtener categorías de precio";
};

export async function GET() {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/price-category`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
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

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("Error fetching price categories:", error);
    return NextResponse.json({ error: "Failed to fetch price categories" }, { status: 500 });
  }
}
