// app/api/web/inventory/snapshots/route.ts
// Endpoint para gestión de snapshots diarios de inventario

import { NextRequest, NextResponse } from "next/server";
import { createDailySnapshot } from "@/lib/inventoryService";
import InventorySnapshotModel from "@/models/InventorySnapshot";
import { connectDB } from "@/lib/db";

// GET: Obtener snapshots con filtros de fecha
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const query: any = {};

    if (searchParams.get("startDate")) {
      query.snapshotDate = { 
        $gte: new Date(searchParams.get("startDate")!) 
      };
    }

    if (searchParams.get("endDate")) {
      if (!query.snapshotDate) query.snapshotDate = {};
      query.snapshotDate.$lte = new Date(searchParams.get("endDate")!);
    }

    const snapshots = await InventorySnapshotModel.find(query)
      .sort({ snapshotDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: snapshots.length,
      snapshots,
    });
  } catch (error: any) {
    console.error("Error al obtener snapshots:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Crear snapshot manualmente (útil para testing)
export async function POST(request: NextRequest) {
  try {
    const snapshot = await createDailySnapshot();

    return NextResponse.json({
      success: true,
      message: "Snapshot creado correctamente",
      snapshot,
    });
  } catch (error: any) {
    console.error("Error al crear snapshot:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
