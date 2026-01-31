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
        const oldItemId = batch.item.toString(); // Ensure string comparison

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
        if (oldItemId !== itemId) {
            // CASE 1: Item Changed

            // 1. Revert Old Item Stock (Remove old quantity)
            const oldItem = await InventoryModel.findById(oldItemId);
            if (oldItem) {
                const newOldStock = Math.max(0, (oldItem.currentStock || 0) - oldQuantity);
                await InventoryModel.findByIdAndUpdate(oldItemId, {
                    currentStock: newOldStock
                });
            }

            // 2. Add to New Item Stock (Add new quantity)
            await InventoryModel.findByIdAndUpdate(itemId, {
                $inc: { currentStock: currentQuantity }
            });

        } else {
            // CASE 2: Same Item, Quantity Changed
            const quantityDifference = currentQuantity - oldQuantity;

            if (quantityDifference !== 0) {
                const currentItem = await InventoryModel.findById(itemId);
                if (currentItem) {
                    // Ensure we don't go below zero if reducing stock
                    const newStock = Math.max(0, (currentItem.currentStock || 0) + quantityDifference);
                    await InventoryModel.findByIdAndUpdate(itemId, {
                        currentStock: newStock
                    });
                }
            }
        }

        // Log the change in history
        const InventoryHistoryModel = (await import("@/models/InventoryHistory")).default;
        await InventoryHistoryModel.create({
            item: itemId,
            type: "adjustment",
            quantityChange: currentQuantity - oldQuantity, // Net change for the record (might be confusing if item changed, but standardizes the field)
            batch: batch._id, // Ensure batch link is preserved
            reason: oldItemId !== itemId
                ? `Cambio de ítem (${oldItemId} -> ${itemId}) y ajuste: ${oldQuantity}m -> ${currentQuantity}m`
                : `Edición de bobina ${batchCode}: ${oldQuantity}m -> ${currentQuantity}m`,
            performedBy: sessionUser?.userId,
            performedByModel: sessionUser?.userModel,
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
