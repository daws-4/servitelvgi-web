// app/api/web/inventory/batches/update/route.ts
// API endpoint for updating bobbin/batch information

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/authHelpers";

export async function PUT(request: NextRequest) {
    try {
        await connectDB();
        const sessionUser = await getUserFromRequest(request);
        const data = await request.json();

        const { batchCode, itemId, currentQuantity } = data;

        // Validations
        if (!batchCode) {
            return NextResponse.json(
                { message: "Código de bobina requerido" },
                { status: 400 }
            );
        }

        if (!itemId) {
            return NextResponse.json(
                { message: "Item requerido" },
                { status: 400 }
            );
        }

        if (currentQuantity === undefined || currentQuantity < 0) {
            return NextResponse.json(
                { message: "Cantidad debe ser mayor o igual a 0" },
                { status: 400 }
            );
        }

        // Import models
        const InventoryBatchModel = (await import("@/models/InventoryBatch")).default;
        const InventoryModel = (await import("@/models/Inventory")).default;

        // Verify item exists
        const item = await InventoryModel.findById(itemId);
        if (!item) {
            return NextResponse.json(
                { message: "Item no encontrado" },
                { status: 404 }
            );
        }

        // Verify item has unit 'metros'
        if (item.unit !== "metros") {
            return NextResponse.json(
                { message: "El item debe tener unidad en metros" },
                { status: 400 }
            );
        }

        // Find and update the bobbin
        const batch = await InventoryBatchModel.findOne({ batchCode });

        if (!batch) {
            return NextResponse.json(
                { message: "Bobina no encontrada" },
                { status: 404 }
            );
        }

        const oldQuantity = batch.currentQuantity;
        const quantityDifference = currentQuantity - oldQuantity;

        // Update batch
        batch.item = itemId;
        batch.currentQuantity = currentQuantity;

        // Update status based on quantity
        if (currentQuantity === 0) {
            batch.status = "depleted";
        } else if (batch.status === "depleted") {
            batch.status = "active";
        }

        await batch.save();

        // Update inventory totals
        if (quantityDifference !== 0) {
            await InventoryModel.findByIdAndUpdate(itemId, {
                $inc: { currentStock: quantityDifference }
            });
        }

        // Log the change in history
        const InventoryHistoryModel = (await import("@/models/InventoryHistory")).default;
        await InventoryHistoryModel.create({
            item: itemId,
            type: quantityDifference > 0 ? "inbound" : "outbound",
            quantity: Math.abs(quantityDifference),
            user: sessionUser?.name || "Sistema",
            location: "warehouse",
            description: `Edición de bobina ${batchCode}: ${oldQuantity}m → ${currentQuantity}m`,
            batchCode,
        });

        return NextResponse.json(
            {
                message: "Bobina actualizada exitosamente",
                batch: await InventoryBatchModel.findOne({ batchCode })
                    .populate("item", "code description unit")
                    .lean()
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error al actualizar bobina:", error);
        return NextResponse.json(
            { message: error.message || "Error al actualizar bobina" },
            { status: 500 }
        );
    }
}
