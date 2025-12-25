// app/api/web/crews/[id]/equipment-instances/route.ts
// API endpoint for fetching equipment instances assigned to a crew

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import CrewModel from "@/models/Crew";
import InventoryModel from "@/models/Inventory";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET: Get equipment instances assigned to a specific crew
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB();
    const { id: crewId } = await context.params;

    const crew = await CrewModel.findById(crewId)
      .populate('assignedInventory.item')
      .lean();

    if (!crew || Array.isArray(crew)) {
      return NextResponse.json(
        { success: false, error: "Cuadrilla no encontrada" },
        { status: 404 }
      );
    }

    // Get equipment types assigned to crew
    const equipmentTypes = crew.assignedInventory
      .filter((inv: any) => inv.item && inv.item.type === "equipment");

    const instances = [];

    // For each equipment type, get its instances assigned to this crew
    for (const eq of equipmentTypes) {
      const fullItem = await InventoryModel.findById(eq.item._id);
      
      if (!fullItem) continue;

      const crewInstances = fullItem.instances.filter(
        (inst: any) => inst.assignedTo?.crewId?.toString() === crewId && inst.status === 'assigned'
      );

      instances.push(...crewInstances.map((inst: any) => ({
        uniqueId: inst.uniqueId,
        serialNumber: inst.serialNumber,
        macAddress: inst.macAddress,
        status: inst.status,
        notes: inst.notes,
        inventoryId: fullItem._id.toString(),
        itemCode: fullItem.code,
        itemDescription: fullItem.description,
      })));
    }

    return NextResponse.json({
      success: true,
      count: instances.length,
      instances,
    });
  } catch (error: any) {
    console.error("Error al obtener instancias del equipo de la cuadrilla:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
