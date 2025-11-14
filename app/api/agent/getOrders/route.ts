// app/api/agent/getOrders/route.ts

import { NextRequest, NextResponse } from "next/server";

// Responde a GET con el texto "ok" en formato JSON
export async function GET(request: NextRequest) {
  return NextResponse.json("ok", { status: 200 });
}
// Responde a POST leyendo el body JSON y mostrando los datos en la consola del servidor
export async function POST(request: NextRequest) {
  try {
    // 1. Obtener el cuerpo (body) de la solicitud POST
    // Esto asume que los datos vienen como JSON.
    const body = await request.json();

    // 2. ¡EL PASO CLAVE! Mostrar los datos recibidos en la consola del servidor.
    // (En Vercel, esto aparecerá en los "Logs" de la función).
    console.log("✅ Datos recibidos en /api/agent/getOrders:");
    console.log(JSON.stringify(body, null, 2)); // Usamos stringify para un log bonito

    // 3. Responder al cliente (N8N) que todo salió bien
    return NextResponse.json(
      { message: "Datos recibidos y logueados exitosamente." },
      { status: 200 }
    );
  } catch (error) {
    // 4. Manejar el error si el body no es un JSON válido
    console.error(
      "❌ Error: El body no es un JSON válido o hubo otro problema:",
      error
    );
    return NextResponse.json(
      {
        error:
          "Error al procesar la solicitud. El JSON podría estar malformado.",
      },
      { status: 400 } // 400 Bad Request
    );
  }
}

