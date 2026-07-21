import { getValidToken } from "@/app/lib/helper";
import { NextResponse } from "next/server";

const toUtcIso = (value: string, boundary: "start" | "end") => {
  const time = boundary === "start" ? "00:00:00.000" : "23:59:59.999";
  const date = new Date(`${value}T${time}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export async function GET(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const requestUrl = new URL(req.url);
  const params = new URLSearchParams(requestUrl.searchParams);

  const dateFrom = params.get("dateFrom");
  if (dateFrom) {
    const utcValue = toUtcIso(dateFrom, "start");
    if (utcValue) params.set("dateFrom", utcValue);
  }

  const dateTo = params.get("dateTo");
  if (dateTo) {
    const utcValue = toUtcIso(dateTo, "end");
    if (utcValue) params.set("dateTo", utcValue);
  }

  const queryString = params.toString();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/reports/clients/without-purchases${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    return NextResponse.json(
      { message: errorData?.detail || "Error al obtener el reporte de clientes sin compras" },
      { status: res.status },
    );
  }

  const data = await res.json();

  return NextResponse.json(data);
}
