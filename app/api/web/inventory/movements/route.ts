// app/api/web/inventory/movements/route.ts
// Endpoint para movimientos de inventario (reabastecimiento y asignación)

import { NextRequest, NextResponse } from "next/server";
import {
  restockInventory,
  assignMaterialToCrew,
} from "@/lib/inventoryService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { success: false, error: "Action y data son requeridos" },
        { status: 400 }
      );
    }

    switch (action) {
      case "restock": {
        // Reabastecimiento de bodega
        const { items, reason } = data;

        if (!items || !Array.isArray(items) || items.length === 0) {
          return NextResponse.json(
            { success: false, error: "Items es requerido y debe ser un array" },
            { status: 400 }
          );
        }

        if (!reason) {
          return NextResponse.json(
            { success: false, error: "Reason es requerido" },
            { status: 400 }
          );
        }

        const updatedItems = await restockInventory(items, reason);

        return NextResponse.json({
          success: true,
          message: "Inventario reabastecido correctamente",
          items: updatedItems,
        });
      }

      case "assign": {
        // Asignación a cuadrilla
        const { crewId, items, userId } = data;

        if (!crewId) {
          return NextResponse.json(
            { success: false, error: "crewId es requerido" },
            { status: 400 }
          );
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
          return NextResponse.json(
            { success: false, error: "Items es requerido y debe ser un array" },
            { status: 400 }
          );
        }

        const updatedCrew = await assignMaterialToCrew(crewId, items, userId);

        return NextResponse.json({
          success: true,
          message: "Materiales asignados correctamente a la cuadrilla",
          crew: updatedCrew,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Acción no válida: ${action}. Usar 'restock' o 'assign'`,
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Error en movimiento de inventario:", error);

    // Manejo específico de errores de stock insuficiente
    if (error.message.includes("Stock insuficiente")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
