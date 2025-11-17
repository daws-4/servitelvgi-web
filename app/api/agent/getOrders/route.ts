// app/api/agent/getOrders/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import OrderModel from "../../../../models/Order";

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

// Responde a POST leyendo el body (JSON o texto) y guardando/actualizando la orden en MongoDB
export async function POST(request: Request) {
  try {
    // Asegurar conexión a DB
    await connectDB();

    let body: unknown;

    // Intentar parsear como JSON primero; si falla, obtener como texto y reintentar parseo
    try {
      body = await request.json();
    } catch (jsonErr) {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch (parseErr) {
        // No es JSON válido
        return NextResponse.json(
          { error: "Request body must be valid JSON" },
          { status: 400, headers: CORS_HEADERS }
        );
      }
    }

    // Ahora body debe ser un objeto
    const data = (body ?? {}) as Record<string, any>;

    console.log("✅ Datos recibidos en /api/agent/getOrders:");
    try {
      console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      console.log(String(data));
    }

    // Validación mínima: extraer exactamente subscriberNumber del modelo
    const subscriberNumber =
      data.subscriberNumber ||
      data.subscriber_number ||
      data.NAbonado ||
      data.subscriber?.number;
    if (!subscriberNumber) {
      return NextResponse.json(
        { error: "subscriberNumber (N. Abonado) is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Helpers para normalizar
    const splitToArray = (v: any) => {
      if (!v && v !== 0) return [];
      if (Array.isArray(v))
        return v.map((s) => String(s).trim()).filter(Boolean);
      return String(v)
        .split(/[;,|\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    };

    const deduceType = (
      explicit: any,
      services: string[],
      textFields: string[]
    ) => {
      if (explicit && typeof explicit === "string") return explicit;
      const joined = [...services, ...textFields].join(" ").toLowerCase();
      if (/instal|instalaci|instalar/.test(joined)) return "instalacion";
      if (/averi|fallo|no funciona|repar|reparaci/.test(joined))
        return "averia";
      return "otro";
    };

    const mapStatus = (s: any) => {
      if (!s) return "pending";
      const str = String(s).toLowerCase();
      if (/pendiente|pending/.test(str)) return "pending";
      if (/asignado|assigned/.test(str)) return "assigned";
      if (/en[_ ]?progreso|in_progress|in progress/.test(str))
        return "in_progress";
      if (/completado|completed/.test(str)) return "completed";
      if (/cancelado|cancelled/.test(str)) return "cancelled";
      return str;
    };

    // Extraer campos exactamente según el modelo JSON que diste
    const subscriberName =
      data.subscriberName || data.subscriber?.name || data.nombre || "";
    const address = data.address || data.direccion || data.address_full || "";
    const phones = splitToArray(
      data.phones || data.telefonos || data.phone || data.telefono
    );
    const email = data.email || data.correo || "";
    const node = data.node || data.nodo || "";
    const servicesToInstall = splitToArray(
      data.servicesToInstall || data.services || data.servicios
    );

    const type = deduceType(
      data.type,
      servicesToInstall,
      [data.title, data.subject, data.description, data.body].filter(Boolean)
    );
    const status = mapStatus(
      data.status || data.orderStatus || data.estado || "pending"
    );

    const update = {
      subscriberNumber: String(subscriberNumber),
      type,
      status,
      subscriberName,
      address,
      phones,
      email,
      node,
      servicesToInstall,
    } as Record<string, any>;

    // Verificaciones previas al guardado
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    // Regla 1: si es instalación y existe otra orden con la misma dirección EXACTA -> siempre indicar que ya existe (302)
    if (update.type === "instalacion" && update.address) {
      const existingInstall = await OrderModel.findOne({
        address: update.address,
      }).lean();
      if (existingInstall) {
        return NextResponse.json(
          { error: "Order already exists (installation with same address)" },
          { status: 302, headers: CORS_HEADERS }
        );
      }
    }

    // Regla general: buscar órdenes con mismos datos creadas en la última semana
    // Consideramos "mismos datos" si coincide el subscriberNumber, o subscriberName + address
    const sameDataFilter: any = {
      $and: [
        {
          $or: [
            { subscriberNumber: update.subscriberNumber },
            { subscriberName: update.subscriberName, address: update.address },
          ],
        },
        { createdAt: { $gte: weekAgo } },
      ],
    };

    const existingRecent = await OrderModel.findOne(sameDataFilter).lean();

    if (existingRecent) {
      // Regla 2: si es avería, indicar que ya existe sólo si los datos son los mismos y la fecha de creación es de la última semana
      if (update.type === "averia") {
        return NextResponse.json(
          { error: "Order already exists (fault reported within last week)" },
          { status: 302, headers: CORS_HEADERS }
        );
      }

      // Para otros tipos (no instalación, porque instalaciones ya se manejaron), también considerarlo duplicado
      return NextResponse.json(
        { error: "Order already exists (same data within last week)" },
        { status: 302, headers: CORS_HEADERS }
      );
    }

    // Si no hay conflicto, hacer upsert: si existe por subscriberNumber actualizar; si no crear
    const order = await OrderModel.findOneAndUpdate(
      { subscriberNumber: update.subscriberNumber },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json(
      { message: "Order saved", order },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("❌ Error al procesar la solicitud:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud." },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
