import { NextResponse } from "next/server";

import { getValidToken } from "@/app/lib/helper";

const readErrorMessage = (body: unknown) => {
  if (!body || typeof body !== "object") {
    return "Error al consultar la gestion de caja activa";
  }

  const errorBody = body as {
    detail?: string;
    message?: string;
    error?: string;
  };
  return (
    errorBody.detail ||
    errorBody.message ||
    errorBody.error ||
    "Error al consultar la gestion de caja activa"
  );
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ cashRegisterId: string }> },
) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { cashRegisterId } = await params;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/billing/cash-management/active/cash-register/${cashRegisterId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

  return NextResponse.json(responseBody);
}
