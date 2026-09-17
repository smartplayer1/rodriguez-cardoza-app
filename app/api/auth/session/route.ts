import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getValidToken } from "@/app/lib/helper";
import { isJwtDecoded, mapUserFromToken } from "@/app/utils/mapUser";

// Equivalente a GET /auth/me: el frontend lo consulta al arrancar para
// reconstruir el estado de sesión a partir de la cookie httpOnly en vez de
// confiar únicamente en lo último que quedó guardado en localStorage.
// Nunca debe romper el arranque normal de la app: ante cualquier duda,
// responde authenticated:false en vez de lanzar un error.
export async function GET() {
  try {
    const token = await getValidToken();

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const decoded = jwt.decode(token);

    if (!isJwtDecoded(decoded)) {
      return NextResponse.json({ authenticated: false });
    }

    const user = mapUserFromToken(decoded);

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error("SESSION CHECK failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ authenticated: false });
  }
}
