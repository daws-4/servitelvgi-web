// app/api/web/inventory/route.ts
// CRUD de ítems del catálogo de inventario

import { NextRequest, NextResponse } from "next/server";
import {
  getInventoryItems,
} from "@/lib/inventoryService";
import InventoryModel from "@/models/Inventory";
import { connectDB } from "@/lib/db";

// GET: Listar ítems de inventario con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      search: searchParams.get("search") || undefined,
      type: searchParams.get("type") || undefined,
      lowStock: searchParams.get("lowStock") === "true",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
    };

    const result = await getInventoryItems(filters);

    return NextResponse.json({
      success: true,
      count: result.total,
      items: result.items,
    });
  } catch (error: any) {
    console.error("Error al obtener inventario:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo ítem de inventario
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { code, description, unit, currentStock, minimumStock, type, instances } = body;

    // Validar campos requeridos
    if (!code || !description) {
      return NextResponse.json(
        { success: false, error: "Código y descripción son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el código no exista
    const existing = await InventoryModel.findOne({ code });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `El código ${code} ya existe` },
        { status: 400 }
      );
    }

    // Preparar datos del nuevo ítem
    const itemData: any = {
      code,
      description,
      unit: unit || "unidades",
      currentStock: currentStock || 0,
      minimumStock: minimumStock || 5,
      type: type || "material",
    };

    // Si el tipo es equipment y hay instancias, añadirlas
    if (type === "equipment" && instances && Array.isArray(instances)) {
      // Validar uniqueIds únicos
      const uniqueIds = instances.map((inst: any) => inst.uniqueId);
      const hasDuplicates = uniqueIds.length !== new Set(uniqueIds).size;

      if (hasDuplicates) {
        return NextResponse.json(
          { success: false, error: "Los IDs únicos de las instancias deben ser únicos" },
          { status: 400 }
        );
      }

      itemData.instances = instances.map((inst: any) => ({
        uniqueId: inst.uniqueId,
        serialNumber: inst.serialNumber,
        macAddress: inst.macAddress,
        notes: inst.notes,
        status: "in-stock",
        createdAt: new Date(),
      }));

      // El middleware actualizará currentStock automáticamente
    }

    const newItem = await InventoryModel.create(itemData);

    return NextResponse.json({
      success: true,
      item: newItem,
    });
  } catch (error: any) {
    console.error("Error al crear ítem:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Actualizar ítem de inventario
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { id, description, unit, minimumStock, type } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID del ítem es requerido" },
        { status: 400 }
      );
    }

    const updatedItem = await InventoryModel.findByIdAndUpdate(
      id,
      {
        ...(description && { description }),
        ...(unit && { unit }),
        ...(minimumStock !== undefined && { minimumStock }),
        ...(type && { type }),
      },
      { new: true }
    );

    if (!updatedItem) {
      return NextResponse.json(
        { success: false, error: "Ítem no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error: any) {
    console.error("Error al actualizar ítem:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar ítem de inventario
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const force = searchParams.get("force") === "true";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID del ítem es requerido" },
        { status: 400 }
      );
    }

    // Check for associated bobbins
    const InventoryBatchModel = (await import("@/models/InventoryBatch")).default;
    const associatedBobbins = await InventoryBatchModel.find({ item: id });

    if (associatedBobbins.length > 0 && !force) {
      // Return warning with bobbin information
      return NextResponse.json({
        success: false,
        requiresConfirmation: true,
        bobbinCount: associatedBobbins.length,
        bobbinCodes: associatedBobbins.map(b => b.batchCode),
        message: `Este ítem tiene ${associatedBobbins.length} bobina${associatedBobbins.length > 1 ? 's' : ''} asociada${associatedBobbins.length > 1 ? 's' : ''} que también se eliminarán.`
      }, { status: 409 });
    }

    // If force is true or no bobbins, proceed with deletion
    if (force && associatedBobbins.length > 0) {
      // Delete all associated bobbins
      await InventoryBatchModel.deleteMany({ item: id });
    }

    const deletedItem = await InventoryModel.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json(
        { success: false, error: "Ítem no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Ítem eliminado correctamente${associatedBobbins.length > 0 ? ` junto con ${associatedBobbins.length} bobina${associatedBobbins.length > 1 ? 's' : ''}` : ''}`,
      deletedBobbins: associatedBobbins.length
    });
  } catch (error: any) {
    console.error("Error al eliminar ítem:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
