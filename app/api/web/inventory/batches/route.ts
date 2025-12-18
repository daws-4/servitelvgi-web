// app/api/web/inventory/batches/route.ts
// API para gestionar lotes/bobinas de inventario

import { NextRequest, NextResponse } from "next/server";
import {
  createBatch,
  getBatches,
  assignMetersToBatch,
  deleteBatch,
} from "@/lib/inventoryService";
import { getUserFromRequest } from "@/lib/authHelpers";

/**
 * GET /api/web/inventory/batches
 * Obtiene lista de lotes con filtros opcionales
 * Query params: itemId, location, crewId, status, batchCode
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: any = {};
    if (searchParams.get("itemId")) filters.itemId = searchParams.get("itemId");
    if (searchParams.get("location"))
      filters.location = searchParams.get("location");
    if (searchParams.get("crewId")) filters.crewId = searchParams.get("crewId");
    if (searchParams.get("status")) filters.status = searchParams.get("status");
    if (searchParams.get("batchCode"))
      filters.batchCode = searchParams.get("batchCode");

    const batches = await getBatches(filters);

    return NextResponse.json(batches, { status: 200 });
  } catch (error: any) {
    console.error("Error al obtener lotes:", error);
    return NextResponse.json(
      { message: error.message || "Error al obtener lotes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/web/inventory/batches
 * Crea un nuevo lote/bobina
 * Body: { batchCode, inventoryId, initialQuantity, unit?, supplier?, acquisitionDate?, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    const data = await request.json();

    // Validaciones básicas
    if (!data.batchCode || !data.inventoryId || !data.initialQuantity) {
      return NextResponse.json(
        {
          message:
            "Campos requeridos: batchCode, inventoryId, initialQuantity",
        },
        { status: 400 }
      );
    }

    if (data.initialQuantity <= 0) {
      return NextResponse.json(
        { message: "La cantidad inicial debe ser mayor a 0" },
        { status: 400 }
      );
    }

    const batch = await createBatch(data, sessionUser ?? undefined);

    return NextResponse.json(
      { message: "Lote creado exitosamente", batch },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al crear lote:", error);
    
    // Manejar error de código duplicado
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Ya existe un lote con ese código" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Error al crear lote" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/web/inventory/batches
 * Asigna metros a una bobina existente
 * Body: { batchCode, metersToAdd }
 */
export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    const data = await request.json();

    if (!data.batchCode || !data.metersToAdd) {
      return NextResponse.json(
        { message: "Campos requeridos: batchCode, metersToAdd" },
        { status: 400 }
      );
    }

    if (data.metersToAdd <= 0) {
      return NextResponse.json(
        { message: "Los metros a añadir deben ser mayor a 0" },
        { status: 400 }
      );
    }

    const batch = await assignMetersToBatch(
      data.batchCode,
      data.metersToAdd,
      sessionUser ?? undefined
    );

    return NextResponse.json(
      { message: "Metros asignados exitosamente", batch },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al asignar metros:", error);
    return NextResponse.json(
      { message: error.message || "Error al asignar metros" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/web/inventory/batches
 * Elimina una bobina agotada
 * Query param: batchCode
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    const searchParams = request.nextUrl.searchParams;
    const batchCode = searchParams.get("batchCode");

    if (!batchCode) {
      return NextResponse.json(
        { message: "Campo requerido: batchCode" },
        { status: 400 }
      );
    }

    const batch = await deleteBatch(batchCode, sessionUser ?? undefined);

    return NextResponse.json(
      { message: "Bobina eliminada exitosamente", batch },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al eliminar bobina:", error);
    return NextResponse.json(
      { message: error.message || "Error al eliminar bobina" },
      { status: 500 }
    );
  }
}
