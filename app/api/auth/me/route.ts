import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    // Leer la cookie del servidor usando el nombre de la variable de entorno
    const cookieName = process.env.JWT_NAME || "token";
    const token = req.cookies.get(cookieName)?.value ?? null;

    if (!token) {
      return NextResponse.json(
        { message: "No authentication token found" },
        { status: 401 }
      );
    }

    // Verificar y decodificar el JWT con el secret
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("Missing JWT_SECRET in environment");
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      sub: string;
      _id: string;
      username: string;
      name: string;
      surname: string;
      email: string;
      role: string;
    };

    // Retornar la información del usuario desde el token
    return NextResponse.json(
      {
        _id: decoded._id,
        username: decoded.username,
        name: decoded.name,
        surname: decoded.surname,
        email: decoded.email,
        role: decoded.role,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Auth verification error:", err);
    return NextResponse.json(
      { message: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
