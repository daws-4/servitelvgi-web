// app/api/cron/daily-snapshot/route.ts
// Endpoint protegido para ejecutar snapshot diario automáticamente
// Llamado por cron job (N8n, Vercel Cron, o servicio externo)

import { NextRequest, NextResponse } from "next/server";
import { createDailySnapshot } from "@/lib/inventoryService";
import { createOrderSnapshot } from "@/lib/orderService";

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

    // 1. Ejecutar snapshot de inventario
    console.log("Ejecutando snapshot diario de inventario...");
    const inventorySnapshot = await createDailySnapshot();

    console.log("Snapshot de inventario creado exitosamente:", {
      date: inventorySnapshot.snapshotDate,
      warehouseItems: inventorySnapshot.warehouseInventory.length,
      crews: inventorySnapshot.crewInventories.length,
    });

    // 2. Ejecutar snapshot de órdenes
    console.log("Ejecutando snapshot diario de órdenes...");
    const orderSnapshot = await createOrderSnapshot();

    console.log("Snapshot de órdenes creado exitosamente:", {
      date: orderSnapshot.snapshotDate,
      crews: orderSnapshot.crewSnapshots.length,
      totalOrders: orderSnapshot.totalOrders,
    });

    return NextResponse.json({
      success: true,
      message: "Snapshots diarios creados correctamente",
      inventorySnapshot: {
        id: inventorySnapshot._id,
        date: inventorySnapshot.snapshotDate,
        totalItems: inventorySnapshot.totalItems,
        totalWarehouseStock: inventorySnapshot.totalWarehouseStock,
        crewsTracked: inventorySnapshot.crewInventories.length,
      },
      orderSnapshot: {
        id: orderSnapshot._id,
        date: orderSnapshot.snapshotDate,
        totalOrders: orderSnapshot.totalOrders,
        totalCompleted: orderSnapshot.totalCompleted,
        totalPending: orderSnapshot.totalPending,
        crewsTracked: orderSnapshot.crewSnapshots.length,
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
