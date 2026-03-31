// app/api/web/crews/[id]/equipment-instances/route.ts
// API endpoint for fetching equipment instances assigned to a crew
import { unstable_cache } from "next/cache";

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

    const getCachedInstances = unstable_cache(
      async (cId: string) => {
        const crew = await CrewModel.findById(cId)
          .populate('assignedInventory.item')
          .lean();

        if (!crew || Array.isArray(crew)) {
          return null;
        }

        const equipmentTypes = (crew.assignedInventory || [])
          .filter((inv: any) => inv.item && inv.item.type === "equipment");

        const instancesList: any[] = [];

        if (equipmentTypes.length > 0) {
          const eqIds = equipmentTypes.map((eq: any) => eq.item._id);
          const fullItems = await InventoryModel.find({
            _id: { $in: eqIds }
          }).lean() as any[];

          for (const fullItem of fullItems) {
            if (!fullItem.instances) continue;

            const crewInstances = fullItem.instances.filter(
              (inst: any) => inst.assignedTo?.crewId?.toString() === cId && inst.status === 'assigned'
            );

            instancesList.push(...crewInstances.map((inst: any) => ({
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
        }
        return instancesList;
      },
      [`crew-equipment-${crewId}`],
      { tags: ['inventory', 'crews'], revalidate: 60 }
    );

    const instances = await getCachedInstances(crewId);

    if (!instances) {
      return NextResponse.json(
        { success: false, error: "Cuadrilla no encontrada" },
        { status: 404 }
      );
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
