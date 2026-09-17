import { NextResponse } from "next/server";
import { refreshToken, RefreshTokenInvalidError } from "@/app/lib/auth";

// Endpoint que el CLIENTE llama directamente (fetch desde el navegador,
// nunca desde un self-fetch de un Server Component) cuando una petición
// recibe 401: a diferencia del refresh proactivo que corre en el
// middleware/getValidToken, esta es la única forma en que un refresh
// reactivo puede persistir las cookies nuevas en el navegador real, porque
// aquí la respuesta SÍ llega directo al cliente.
export async function POST() {
  try {
    await refreshToken();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RefreshTokenInvalidError) {
      return NextResponse.json(
        { success: false, reason: "RefreshTokenNotValid" },
        { status: 401 },
      );
    }

    console.error("REFRESH FAILED:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, reason: "RefreshFailed" },
      { status: 500 },
    );
  }
}
