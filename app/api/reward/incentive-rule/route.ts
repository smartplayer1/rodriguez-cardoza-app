import { getValidToken } from "@/app/lib/helper";
import { NextResponse } from "next/server";

// Mensaje legible del backend: detail, title o la lista de errores de
// validación (ej. reglas de fechas), en vez de un texto genérico.
const readBackendError = (errorData: unknown, fallback: string) => {
  if (!errorData || typeof errorData !== "object") return fallback;
  const data = errorData as {
    detail?: string;
    title?: string;
    message?: string;
    errors?: Record<string, string[] | string> | Array<{ errorMessage?: string; ErrorMessage?: string }>;
  };
  const validation: string[] = [];
  if (Array.isArray(data.errors)) {
    data.errors.forEach((e) => {
      const msg = e?.errorMessage || e?.ErrorMessage;
      if (msg) validation.push(msg);
    });
  } else if (data.errors && typeof data.errors === "object") {
    Object.values(data.errors).forEach((v) => (Array.isArray(v) ? validation.push(...v) : v && validation.push(String(v))));
  }
  return data.detail || (validation.length ? validation.join(" ") : "") || data.message || data.title || fallback;
};

export async function GET(req: Request) {
  const token = await getValidToken();
  if (!token) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const requestUrl = new URL(req.url);
  const queryString = requestUrl.searchParams.toString();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/reward/incentive-rule${queryString ? `?${queryString}` : ''}`,
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
    const errorData = await res.json().catch(() => null);
    return NextResponse.json(
      { message: readBackendError(errorData, "Error al crear la regla de incentivos"), error: errorData },
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
    const errorData = await res.json().catch(() => null);
    return NextResponse.json(
      { message: readBackendError(errorData, "Error al actualizar la regla de incentivos"), error: errorData },
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
