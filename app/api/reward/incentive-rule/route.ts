import { getValidToken } from "@/app/lib/helper";
import { NextResponse } from "next/server";

export async function GET() {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/reward/incentive-rule`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
      { message: errorData.detail || "Error al obtener las reglas de incentivos" },
      { status: res.status },
    );
  }

  const data = await res.json();

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/reward/incentive-rule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json();
 
    return NextResponse.json(
      { message: errorData.detail || "Error al crear la regla de incentivos" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { id, ...payload } = body;

  if (!id) {
    return NextResponse.json({ message: "Falta el id de la regla de incentivos" }, { status: 400 });
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/reward/incentive-rule/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
      { message: errorData.detail || "Error al actualizar la regla de incentivos" },
      { status: res.status },
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const token = await getValidToken();

  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ message: "Falta el id de la regla de incentivos" }, { status: 400 });
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/reward/incentive-rule/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
      { message: errorData.detail || "Error al eliminar la regla de incentivos" },
      { status: res.status },
    );
  }

  return NextResponse.json({ message: "Regla de incentivos eliminada correctamente" });
}
