import { getValidToken } from "@/app/lib/helper";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const requestUrl = new URL(req.url);
  const queryString = requestUrl.searchParams.toString();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/reward/progress${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
console.log("Response status:", res);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    return NextResponse.json(
      { message: errorData?.detail || "Error al obtener progreso de incentivos" },
      { status: res.status },
    );
  }

  const data = await res.json();

  return NextResponse.json(data);
}
