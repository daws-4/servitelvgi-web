// app/api/web/crews/[id]/equipment-instances/return/route.ts
// API endpoint for returning equipment instances from crew to warehouse

import { NextRequest, NextResponse } from "next/server";
import { returnEquipmentInstances } from "@/lib/inventoryService";
import { getUserFromRequest } from "@/lib/authHelpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST: Return equipment instances from crew to warehouse
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: crewId } = await context.params;
    const sessionUser = await getUserFromRequest(request);
    const body = await request.json();

    const { instanceIds, reason } = body;

    if (!instanceIds || !Array.isArray(instanceIds) || instanceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "instanceIds es requerido y debe ser un array no vacío" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: "Motivo de devolución es requerido" },
        { status: 400 }
      );
    }

    const result = await returnEquipmentInstances(
      crewId,
      instanceIds,
      reason,
      sessionUser || undefined
    );

    return NextResponse.json({
      success: true,
      message: `${result.returnedCount} instancia(s) devuelta(s) correctamente`,
      returnedCount: result.returnedCount,
    });
  } catch (error: any) {
    console.error("Error al devolver instancias de equipos:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
