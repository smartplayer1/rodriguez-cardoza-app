import { NextResponse } from "next/server";
import { getValidToken } from "@/app/lib/helper";

export async function GET() {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/v1/identity/modules`;

  let lastStatus = 500;
  let lastMessage = "Error al obtener modulos";

  const res = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    const data = await res.json();
    return NextResponse.json(data);
  }

  lastStatus = res.status;
  const errorData = await res.json().catch(() => null);
  lastMessage = errorData?.detail || errorData?.message || lastMessage;

  return NextResponse.json({ message: lastMessage }, { status: lastStatus });
}
