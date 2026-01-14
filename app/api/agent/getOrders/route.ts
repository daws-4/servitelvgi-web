// app/api/agent/getOrders/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import OrderModel from "@/models/Order";
import CrewModel from "@/models/Crew"; // ✅ NUEVO: para asignación automática de cuadrilla


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
      // Si viene explícito, normalizarlo primero
      if (explicit && typeof explicit === "string") {
        const normalized = explicit.toLowerCase().trim();
        // Detectar "installation" o "instalacion" (con/sin acento)
        if (/^instalaci[oó]n$|^installation$/.test(normalized)) return "instalacion";
        // Detectar "averia" o "avería" o "fault" o "repair"
        if (/^aver[ií]a$|^fault$|^repair$/.test(normalized)) return "averia";
        // Detectar "otro" u "other"
        if (/^otro$|^other$/.test(normalized)) return "otro";
      }
      
      // Si no es explícito o no coincidió, deducir del contexto
      const joined = [...services, ...textFields].join(" ").toLowerCase();
      // Detectar instalación (español e inglés)
      if (/instal|instalaci|instalar|installation|install/.test(joined)) return "instalacion";
      // Detectar avería (español e inglés)
      if (/averi|fallo|no funciona|repar|reparaci|fault|repair|breakdown|failure/.test(joined))
        return "averia";
      return "otro";
    };

    const mapStatus = (s: any) => {
      if (!s) return "pending";
      const str = String(s).toLowerCase().trim();
      
      // Mapear estados en español e inglés
      if (/pendiente|pending|baja/.test(str)) return "pending";
      if (/asignado|assigned/.test(str)) return "assigned";
      if (/en[_ ]?progreso|in[_ ]?progress/.test(str)) return "in_progress";
      if (/completado|completed|finalizado|finished/.test(str)) return "completed";
      if (/cancelado|cancelled|canceled/.test(str)) return "cancelled";
      
      // Si no coincide con ninguno, devolver pending por defecto
      console.warn("⚠️ Status no reconocido:", s, "→ usando 'pending'");
      return "pending";
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
    const ticketId = data.ticket_id || data.ticketId || data.ticketNumber || "";

    const type = deduceType(
      data.type,
      servicesToInstall,
      [data.title, data.subject, data.description, data.body].filter(Boolean)
    );
    const status = mapStatus(
      data.status || data.orderStatus || data.estado || "pending"
    );

    // ============================================
    // ASIGNACIÓN AUTOMÁTICA DE CUADRILLA
    // ============================================
    const crewNumber = data.crewNumber || null;
    let assignedCrew: any = null;
    
    if (crewNumber) {
      console.log("👷 Buscando cuadrilla por número:", crewNumber);
      
      try {
        // Buscar la cuadrilla por número (debe estar activa)
        const foundCrew = await CrewModel.findOne({
          number: Number(crewNumber),
          isActive: true
        }).lean();
        
        if (foundCrew && !Array.isArray(foundCrew)) {
          assignedCrew = foundCrew;
          console.log("✅ Cuadrilla encontrada: Cuadrilla", assignedCrew.number, "ID:", assignedCrew._id);
        } else {
          console.warn("⚠️ Cuadrilla no encontrada con número:", crewNumber);
          console.warn("💡 Asegúrate de que existe una cuadrilla activa con número:", crewNumber);
        }
      } catch (error) {
        console.error("❌ Error al buscar cuadrilla:", error);
      }
    }

    const update = {
      subscriberNumber: String(subscriberNumber),
      ticket_id: ticketId || undefined, // ✅ Agregar ticket_id si existe
      type,
      status: assignedCrew ? "assigned" : status, // ✅ Si se asigna cuadrilla, cambiar a "assigned"
      subscriberName,
      address,
      phones,
      email,
      node,
      servicesToInstall,
      assignedTo: assignedCrew ? assignedCrew._id : undefined, // ✅ Asignar cuadrilla si existe
      assignmentDate: assignedCrew ? new Date() : undefined, // ✅ Registrar fecha de asignación
    } as Record<string, any>;

    // ============================================
    // VERIFICACIONES DE DUPLICADOS
    // ============================================
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    // Verificación 1: Si viene ticket_id y ya existe en el sistema → rechazar
    if (ticketId) {
      const existingTicket = await OrderModel.findOne({
        ticket_id: ticketId,
      }).lean();
      if (existingTicket) {
        return NextResponse.json(
          { error: "Order already exists (duplicate ticket_id)" },
          { status: 302, headers: CORS_HEADERS }
        );
      }
    }

    // Verificación 2: Si es instalación y existe otra orden con la misma dirección EXACTA → rechazar
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

    // Verificación 3: Si es avería, verificar si existe una orden similar en la última semana
    // Consideramos "similar" si coincide subscriberName + address
    if (update.type === "averia") {
      const existingRecentFault = await OrderModel.findOne({
        type: "averia",
        subscriberName: update.subscriberName,
        address: update.address,
        createdAt: { $gte: weekAgo },
      }).lean();

      if (existingRecentFault) {
        return NextResponse.json(
          { error: "Order already exists (fault reported within last week)" },
          { status: 302, headers: CORS_HEADERS }
        );
      }
    }

    // ✅ PERMITIR MÚLTIPLES ÓRDENES CON EL MISMO subscriberNumber
    // Crear siempre una nueva orden en lugar de actualizar una existente
    const order = await OrderModel.create(update);

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
