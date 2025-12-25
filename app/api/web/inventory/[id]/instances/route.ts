// app/api/web/inventory/[id]/instances/route.ts
// API endpoint for fetching instances of a specific inventory item

import { NextRequest, NextResponse } from "next/server";
import { getEquipmentInstances } from "@/lib/inventoryService";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: Get available instances for a specific equipment item
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const filters = status ? { status } : {};
    const instances = await getEquipmentInstances(id, filters);

    return NextResponse.json({
      success: true,
      count: instances.length,
      instances,
    });
  } catch (error: any) {
    console.error("Error al obtener instancias:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
