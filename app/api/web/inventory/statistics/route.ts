// app/api/web/inventory/statistics/route.ts
// Endpoint para cálculo de estadísticas de uso de materiales

import { NextRequest, NextResponse } from "next/server";
import { getInventoryStatistics } from "@/lib/inventoryService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "startDate y endDate son requeridos",
        },
        { status: 400 }
      );
    }

    const filters: any = {};

    if (searchParams.get("crewId")) {
      filters.crewId = searchParams.get("crewId");
    }

    if (searchParams.get("itemId")) {
      filters.itemId = searchParams.get("itemId");
    }

    const statistics = await getInventoryStatistics(
      new Date(startDate),
      new Date(endDate),
      filters
    );

    return NextResponse.json({
      success: true,
      statistics,
    });
  } catch (error: any) {
    console.error("Error al calcular estadísticas:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
