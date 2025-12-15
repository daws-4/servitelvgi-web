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
    };

    const items = await getInventoryItems(filters);

    return NextResponse.json({
      success: true,
      count: items.length,
      items,
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

    const { code, description, unit, currentStock, minimumStock, type } = body;

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

    const newItem = await InventoryModel.create({
      code,
      description,
      unit: unit || "unidades",
      currentStock: currentStock || 0,
      minimumStock: minimumStock || 5,
      type: type || "material",
    });

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

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID del ítem es requerido" },
        { status: 400 }
      );
    }

    // TODO: Verificar que el ítem no esté siendo usado en inventarios de cuadrillas u órdenes

    const deletedItem = await InventoryModel.findByIdAndDelete(id);

    if (!deletedItem) {
      return NextResponse.json(
        { success: false, error: "Ítem no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ítem eliminado correctamente",
    });
  } catch (error: any) {
    console.error("Error al eliminar ítem:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
