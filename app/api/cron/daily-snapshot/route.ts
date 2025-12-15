// app/api/cron/daily-snapshot/route.ts
// Endpoint protegido para ejecutar snapshot diario automáticamente
// Llamado por cron job (N8n, Vercel Cron, o servicio externo)

import { NextRequest, NextResponse } from "next/server";
import { createDailySnapshot } from "@/lib/inventoryService";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación mediante token
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET no configurado en variables de entorno");
      return NextResponse.json(
        { success: false, error: "Configuración de servidor incorrecta" },
        { status: 500 }
      );
    }

    if (authHeader !== cronSecret) {
      console.warn("Intento de acceso no autorizado al cron de snapshot");
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 401 }
      );
    }

    // Ejecutar snapshot
    console.log("Ejecutando snapshot diario...");
    const snapshot = await createDailySnapshot();

    console.log("Snapshot creado exitosamente:", {
      date: snapshot.snapshotDate,
      warehouseItems: snapshot.warehouseInventory.length,
      crews: snapshot.crewInventories.length,
    });

    return NextResponse.json({
      success: true,
      message: "Snapshot diario creado correctamente",
      snapshot: {
        id: snapshot._id,
        date: snapshot.snapshotDate,
        totalItems: snapshot.totalItems,
        totalWarehouseStock: snapshot.totalWarehouseStock,
        crewsTracked: snapshot.crewInventories.length,
      },
    });
  } catch (error: any) {
    console.error("Error al ejecutar snapshot diario:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET para verificar que el endpoint está activo (sin crear snapshot)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: "daily-snapshot",
    status: "active",
    message: "Use POST con Authorization header para ejecutar snapshot",
  });
}
