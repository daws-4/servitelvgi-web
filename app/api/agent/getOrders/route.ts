// app/api/agent/getOrders/route.ts

import { NextResponse } from "next/server";

// Cabeceras CORS útiles para integración (p. ej. N8N). Ajusta según necesidad.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Responde a GET con el texto "ok" en formato JSON
export async function GET(request: Request) {
  return NextResponse.json("ok", { status: 200, headers: CORS_HEADERS });
}

// Maneja preflight CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Responde a POST leyendo el body (JSON o texto) y mostrando los datos en la consola del servidor
export async function POST(request: Request) {
  try {
    let body: unknown;

    // Intentar parsear como JSON primero; si falla, obtener como texto
    try {
      body = await request.json();
    } catch (jsonErr) {
      // No era JSON válido: leer como texto
      const text = await request.text();
      body = text;
    }

    // Loguear lo recibido (si es objeto, hacer stringify bonito)
    console.log("✅ Datos recibidos en /api/agent/getOrders:");
    if (typeof body === "string") {
      console.log(body);
    } else {
      try {
        console.log(JSON.stringify(body, null, 2));
      } catch (err) {
        console.log(String(body));
      }
    }

    // Responder al cliente (N8N) que todo salió bien
    return NextResponse.json(
      { message: "Datos recibidos y logueados exitosamente." },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("❌ Error al procesar la solicitud:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud." },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
