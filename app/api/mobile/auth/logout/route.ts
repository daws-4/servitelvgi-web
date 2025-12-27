import { NextRequest, NextResponse } from "next/server";
import { getInstallerFromBearerToken } from "@/lib/authHelpers";

export async function POST(request: NextRequest) {
  try {
    // Get Authorization header
    const authHeader = request.headers.get("authorization");
    
    // Verify token is valid
    const installer = await getInstallerFromBearerToken(authHeader);
    
    if (!installer) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    // For now, logout is handled client-side by removing the token
    // In the future, we could implement a token blacklist here
    return NextResponse.json(
      {
        message: "Logout exitoso",
        ok: true
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Mobile logout error:", err);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
