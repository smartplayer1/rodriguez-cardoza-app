import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/identity/user/${id}/employee`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    let errorMessage = "Error al asignar empleado";

    try {
      const error = await res.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // fallback si no viene JSON
    }

    return NextResponse.json({ message: errorMessage }, { status: res.status });
  }

  return NextResponse.json({ success: true });
}
