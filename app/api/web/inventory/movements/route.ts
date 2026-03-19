// app/api/web/inventory/movements/route.ts
// Endpoint para movimientos de inventario (reabastecimiento y asignación)

import { NextRequest, NextResponse } from "next/server";
import {
  restockInventory,
  assignMaterialToCrew,
  returnMaterialFromCrew,
  adjustCrewInventory,
} from "@/lib/inventoryService";
import { getUserFromRequest } from "@/lib/authHelpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    // Extract session user for tracking
    const sessionUser = await getUserFromRequest(request);

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

        const updatedItems = await restockInventory(items, reason, sessionUser || undefined);

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

        const updatedCrew = await assignMaterialToCrew(crewId, items, sessionUser || undefined);

        return NextResponse.json({
          success: true,
          message: "Materiales asignados correctamente a la cuadrilla",
          crew: updatedCrew,
        });
      }

      case "return": {
        // Devolución de materiales de cuadrilla a bodega
        const { crewId, items, reason, userId } = data;

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

        if (!reason) {
          return NextResponse.json(
            { success: false, error: "Reason es requerido" },
            { status: 400 }
          );
        }

        const updatedCrew = await returnMaterialFromCrew(
          crewId,
          items,
          reason,
          sessionUser || undefined
        );

        return NextResponse.json({
          success: true,
          message: "Materiales devueltos correctamente al almacén",
          crew: updatedCrew,
        });
      }

      case "adjust": {
        // Ajuste manual de inventario de cuadrilla
        const { crewId, inventoryId, newQuantity, reason, batchCode } = data;

        if (!crewId) {
          return NextResponse.json(
            { success: false, error: "crewId es requerido" },
            { status: 400 }
          );
        }

        if (!inventoryId) {
          return NextResponse.json(
            { success: false, error: "inventoryId es requerido" },
            { status: 400 }
          );
        }

        if (newQuantity === undefined || newQuantity < 0) {
          return NextResponse.json(
            { success: false, error: "newQuantity debe ser mayor o igual a 0" },
            { status: 400 }
          );
        }

        if (!reason) {
          return NextResponse.json(
            { success: false, error: "Motivo es requerido" },
            { status: 400 }
          );
        }

        const result = await adjustCrewInventory(
          crewId,
          inventoryId,
          newQuantity,
          reason,
          batchCode,
          sessionUser || undefined
        );

        return NextResponse.json({
          success: true,
          message: "Ajuste aplicado correctamente",
          result,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Acción no válida: ${action}. Usar 'restock', 'assign', 'return' o 'adjust'`,
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
