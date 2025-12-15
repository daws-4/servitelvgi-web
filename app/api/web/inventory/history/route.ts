// app/api/web/inventory/history/route.ts
// Endpoint para consultar historial de movimientos de inventario

import { NextRequest, NextResponse } from "next/server";
import { getInventoryHistory } from "@/lib/inventoryService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Construir filtros desde query params
    const filters: any = {};

    if (searchParams.get("crewId")) {
      filters.crewId = searchParams.get("crewId");
    }

    if (searchParams.get("itemId")) {
      filters.itemId = searchParams.get("itemId");
    }

    if (searchParams.get("type")) {
      filters.type = searchParams.get("type");
    }

    if (searchParams.get("startDate")) {
      filters.startDate = new Date(searchParams.get("startDate")!);
    }

    if (searchParams.get("endDate")) {
      filters.endDate = new Date(searchParams.get("endDate")!);
    }

    const history = await getInventoryHistory(filters);

    return NextResponse.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error: any) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
