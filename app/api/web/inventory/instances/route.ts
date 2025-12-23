// app/api/web/inventory/instances/route.ts
// API endpoints for managing equipment instances

import { NextRequest, NextResponse } from "next/server";
import {
  addEquipmentInstances,
  getEquipmentInstances,
  updateEquipmentInstance,
  deleteEquipmentInstance,
} from "@/lib/inventoryService";
import { getUserFromRequest } from "@/lib/authHelpers";

// GET: Listar instancias de un equipo con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inventoryId = searchParams.get("inventoryId");
    const status = searchParams.get("status") || undefined;

    if (!inventoryId) {
      return NextResponse.json(
        { success: false, error: "inventoryId es requerido" },
        { status: 400 }
      );
    }

    const filters = status ? { status } : {};
    const instances = await getEquipmentInstances(inventoryId, filters);

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

// POST: Añadir instancias a un equipo
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    const body = await request.json();

    const { inventoryId, instances } = body;

    if (!inventoryId || !instances || !Array.isArray(instances)) {
      return NextResponse.json(
        { success: false, error: "inventoryId e instances (array) son requeridos" },
        { status: 400 }
      );
    }

    // Validar que cada instancia tenga uniqueId
    for (const instance of instances) {
      if (!instance.uniqueId) {
        return NextResponse.json(
          { success: false, error: "Cada instancia debe tener un uniqueId" },
          { status: 400 }
        );
      }
    }

    const updatedItem = await addEquipmentInstances(
      inventoryId,
      instances,
      sessionUser || undefined
    );

    return NextResponse.json({
      success: true,
      item: updatedItem,
      addedCount: instances.length,
    });
  } catch (error: any) {
    console.error("Error al añadir instancias:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una instancia
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { inventoryId, uniqueId, updates } = body;

    if (!inventoryId || !uniqueId || !updates) {
      return NextResponse.json(
        { success: false, error: "inventoryId, uniqueId y updates son requeridos" },
        { status: 400 }
      );
    }

    const updatedItem = await updateEquipmentInstance(
      inventoryId,
      uniqueId,
      updates
    );

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error: any) {
    console.error("Error al actualizar instancia:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una instancia
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inventoryId = searchParams.get("inventoryId");
    const uniqueId = searchParams.get("uniqueId");

    if (!inventoryId || !uniqueId) {
      return NextResponse.json(
        { success: false, error: "inventoryId y uniqueId son requeridos" },
        { status: 400 }
      );
    }

    const updatedItem = await deleteEquipmentInstance(inventoryId, uniqueId);

    return NextResponse.json({
      success: true,
      message: "Instancia eliminada correctamente",
      item: updatedItem,
    });
  } catch (error: any) {
    console.error("Error al eliminar instancia:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
