import { NextRequest, NextResponse } from "next/server";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} from "@/lib/orderService";
import { processOrderUsage, restoreInventoryFromOrder } from "@/lib/inventoryService";
import { getUserFromRequest, getInstallerFromBearerToken } from "@/lib/authHelpers";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (id) {
      const item = await getOrderById(id);
      if (!item)
        return NextResponse.json(
          { error: "Not found" },
          { status: 404, headers: CORS_HEADERS }
        );
      return NextResponse.json(item, { status: 200, headers: CORS_HEADERS });
    }

    // Extract filter parameters from query string
    const filters: any = {};
    const assignedTo = url.searchParams.get("assignedTo");
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");

    if (assignedTo) filters.assignedTo = assignedTo;
    if (status) filters.status = status;
    if (type) filters.type = type;

    const items = await getOrders(filters);
    return NextResponse.json(items, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error("Error fetching orders:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get session user for history tracking and notification exclusion
    // Check both cookie (admin) and bearer token (installer)
    let sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      const authHeader = request.headers.get('Authorization');
      sessionUser = await getInstallerFromBearerToken(authHeader);
    }

    console.log('🔍 [API POST] Session User:', sessionUser ? `${sessionUser.username} (${sessionUser.role})` : 'None');
    console.log('📦 [API POST] Body:', JSON.stringify(body, null, 2));

    const created = await createOrder(body, sessionUser || undefined);
    return NextResponse.json(created, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    console.error("❌ [API POST] Error creating order:", err);

    // Check if it's a validation error (duplicate ticket)
    if (err.message && err.message.includes('ya existe en el sistema')) {
      return NextResponse.json(
        { error: err.message },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Handle mongoose validation errors
    if (err.errors) {
      console.error("❌ [API POST] Validation Errors:", JSON.stringify(err.errors, null, 2));
    }

    // Handle other errors
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || body._id;
    if (!id)
      return NextResponse.json(
        { error: "id is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    const data = { ...body };
    delete data.id;
    delete data._id;

    // Get session user for history tracking
    // Check both cookie (admin) and bearer token (installer)
    let sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      const authHeader = request.headers.get('Authorization');
      sessionUser = await getInstallerFromBearerToken(authHeader);
    }

    console.log('🔍 [API] Session User:', sessionUser ? `${sessionUser.username} (${sessionUser.role})` : 'None');

    // INTEGRACIÓN DE INVENTARIO: Si la orden se está completando con materiales usados
    // procesar el consumo automáticamente
    const hasMaterials = data.materialsUsed && Array.isArray(data.materialsUsed) && data.materialsUsed.length > 0;

    if (hasMaterials || (data.materialsUsed && Array.isArray(data.materialsUsed))) {
      // Obtener la orden actual para verificar y comparar cambios
      const currentOrder = await getOrderById(id) as any;

      if (!currentOrder) {
        return NextResponse.json(
          { error: "Orden no encontrada" },
          { status: 404, headers: CORS_HEADERS }
        );
      }

      // Determine the effective crew for this operation
      // Priority: New assignment from data > Existing assignment from DB
      let effectiveCrewId = data.assignedTo
        ? (typeof data.assignedTo === 'object' ? data.assignedTo._id : data.assignedTo)
        : (currentOrder.assignedTo
          ? (typeof currentOrder.assignedTo === 'object' ? currentOrder.assignedTo._id : currentOrder.assignedTo)
          : null);

      // Normalize to string
      if (effectiveCrewId && typeof effectiveCrewId === 'object') effectiveCrewId = effectiveCrewId.toString();
      if (effectiveCrewId) effectiveCrewId = String(effectiveCrewId);

      // Validate: Must have a crew to consume materials
      if (!effectiveCrewId && hasMaterials) {
        return NextResponse.json(
          { error: "La orden debe tener una cuadrilla asignada para consumir materiales" },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      // Crew ID for restoration (Previous Crew)
      const previousCrewId = (currentOrder.assignedTo && typeof currentOrder.assignedTo === 'object' && '_id' in currentOrder.assignedTo)
        ? (currentOrder.assignedTo as any)._id.toString()
        : (currentOrder.assignedTo ? currentOrder.assignedTo.toString() : null);

      // Crew ID for deduction (Target/Effective Crew)
      const targetCrewId = effectiveCrewId;

      // --- LOGIC FOR RESTORING REMOVED MATERIALS ---
      // Compare currentOrder.materialsUsed vs data.materialsUsed
      // Identify items present in DB but NOT in Payload (or reduced quantity/instances)

      const currentMaterials = currentOrder.materialsUsed || [];
      const newMaterials = data.materialsUsed || [];

      const materialsToRestore: any[] = [];

      // 1. Check for removed Instances (Equipment)
      // Map all current instances vs new instances
      const currentInstanceIds = new Set<string>();
      const instanceIdToMaterialMap = new Map<string, string>(); // instanceId -> inventoryId

      currentMaterials.forEach((m: any) => {
        if (m.instanceIds && m.instanceIds.length > 0) {
          m.instanceIds.forEach((iid: string) => {
            currentInstanceIds.add(iid);
            const invId = (m.item && typeof m.item === 'object') ? m.item._id.toString() : (m.item || m.inventoryId).toString();
            instanceIdToMaterialMap.set(iid, invId);
          });
        }
      });

      const newInstanceIds = new Set<string>();
      newMaterials.forEach((m: any) => {
        if (m.instanceIds && m.instanceIds.length > 0) {
          m.instanceIds.forEach((iid: string) => newInstanceIds.add(iid));
        }
      });

      // Find removed instances
      const removedInstanceIds = Array.from(currentInstanceIds).filter(id => !newInstanceIds.has(id));

      console.log(`[DEBUG] Restoration Check:
      - Current Instances (DB): ${Array.from(currentInstanceIds).join(', ')}
      - New Instances (Payload): ${Array.from(newInstanceIds).join(', ')}
      - Removed Instances Detected: ${removedInstanceIds.join(', ')}`);

      if (removedInstanceIds.length > 0) {
        // Group by inventoryId for cleaner processing
        const groupedRestorations: Record<string, string[]> = {};

        removedInstanceIds.forEach(iid => {
          const invId = instanceIdToMaterialMap.get(iid);
          if (invId) {
            if (!groupedRestorations[invId]) groupedRestorations[invId] = [];
            groupedRestorations[invId].push(iid);
          }
        });

        Object.entries(groupedRestorations).forEach(([invId, instances]) => {
          materialsToRestore.push({
            inventoryId: invId,
            quantity: instances.length,
            instanceIds: instances
          });
        });
      }

      // 2. Check for removed Bobbins (batchCode) - ALWAYS restore since consumed early
      // Bobbins are consumed when assigned to order, so they must be restored when removed regardless of order status
      currentMaterials.forEach((curr: any) => {
        // Only handle bobbins here (identified by batchCode)
        if (!curr.batchCode) return;
        // Skip if it was an equipment instance (already handled above)
        if (curr.instanceIds && curr.instanceIds.length > 0) return;

        const currInvId = (curr.item && typeof curr.item === 'object') ? curr.item._id.toString() : (curr.item || curr.inventoryId).toString();
        const currBatch = curr.batchCode;

        const match = newMaterials.find((newMat: any) => {
          const newInvId = (newMat.item && typeof newMat.item === 'object') ? newMat.item._id : (newMat.item || newMat.inventoryId);
          return newInvId === currInvId && newMat.batchCode === currBatch;
        });

        if (!match) {
          // Bobbin completely removed - restore full quantity
          materialsToRestore.push({
            inventoryId: currInvId,
            quantity: curr.quantity,
            batchCode: currBatch
          });
        } else {
          // Bobbin exists, check quantity reduction
          if (curr.quantity > match.quantity) {
            const delta = curr.quantity - match.quantity;
            materialsToRestore.push({
              inventoryId: currInvId,
              quantity: delta,
              batchCode: currBatch
            });
          }
        }
      });

      // 3. Check for removed Generic Materials (Quantity)
      // Now that we deduct all materials immediately (not just on completion),
      // we need to restore removed materials regardless of order status
      {
        // Map current Generic items
        // We need to compare by inventoryId (or batchCode)
        // Warning: processOrderUsage deducts generic materials blindly. 
        // If we reduce quantity, we restore delta. 
        // If we remove item, we restore total.

        // Simplified logic: Iterate current, find match in new.
        currentMaterials.forEach((curr: any) => {
          // Skip bobbins (already handled above)
          if (curr.batchCode) return;
          // Skip if it was an equipment instance (already handled above)
          if (curr.instanceIds && curr.instanceIds.length > 0) return;

          const currInvId = (curr.item && typeof curr.item === 'object') ? curr.item._id.toString() : (curr.item || curr.inventoryId).toString();

          const match = newMaterials.find((newMat: any) => {
            const newInvId = (newMat.item && typeof newMat.item === 'object') ? newMat.item._id : (newMat.item || newMat.inventoryId);
            return newInvId === currInvId && !newMat.batchCode; // Match regular materials only
          });

          if (!match) {
            // Item completely removed
            materialsToRestore.push({
              inventoryId: currInvId,
              quantity: curr.quantity,
              batchCode: undefined
            });
          } else {
            // Item exists, check quantity reduction
            if (curr.quantity > match.quantity) {
              const delta = curr.quantity - match.quantity;
              materialsToRestore.push({
                inventoryId: currInvId,
                quantity: delta,
                batchCode: undefined
              });
            }
          }
        });
      }

      // Execute Restoration if needed
      if (materialsToRestore.length > 0 && previousCrewId) {
        try {
          console.log("Restoring materials:", JSON.stringify(materialsToRestore));
          await restoreInventoryFromOrder(id, previousCrewId, materialsToRestore, sessionUser || undefined);
        } catch (restoreErr) {
          console.error("Error restoring inventory:", restoreErr);
          // We log but maybe shouldn't block the update? 
          // Or strictly block to ensure consistency? Blocking is safer.
          return NextResponse.json(
            { error: `Error restaurando inventario: ${String(restoreErr)}` },
            { status: 400, headers: CORS_HEADERS }
          );
        }
      }

      // Logic for inventory processing:
      // Process ALL materials regardless of status (equipment, bobbins, and regular materials)
      // Delta calculation below (lines 328-362) already prevents duplicate processing
      // This ensures materials are deducted immediately when assigned from mobile app

      let materialsToProcess: any[] = [];

      // Always process all materials - idempotency is handled by delta calculation
      materialsToProcess = data.materialsUsed || [];

      if (materialsToProcess.length > 0) {

        // ... Existing logic ...

        // IMPORTANT: processOrderUsage for Materials is NOT idempotent for quantity.
        // It deducts whatever is passed.
        // We should ALWAYS compare current vs new and only process DELTA (new items or increases).
        // This applies to ALL status transitions, not just completed->completed.

        // Delta calculation: Only process NEW bobbins/equipment or QUANTITY INCREASES
        const deltaMaterials: any[] = [];

        materialsToProcess.forEach((newMat: any) => {
          // Check against current (DB)
          const newInvId = (newMat.item && typeof newMat.item === 'object') ? newMat.item._id : (newMat.item || newMat.inventoryId);
          const newBatch = newMat.batchCode;

          // For equipment instances, idempotency is handled inside processOrderUsage (status check)
          if (newMat.instanceIds && newMat.instanceIds.length > 0) {
            deltaMaterials.push(newMat);
            return;
          }

          // For bobbins and generic materials, we need to check if it already exists in DB
          const oldMat = currentMaterials.find((curr: any) => {
            const currInvId = (curr.item && typeof curr.item === 'object') ? curr.item._id.toString() : (curr.item || curr.inventoryId).toString();
            return currInvId === newInvId && curr.batchCode === newBatch;
          });

          if (!oldMat) {
            // Completely new item - process full quantity
            deltaMaterials.push(newMat);
          } else {
            // Item exists in DB, only process if quantity INCREASED
            if (newMat.quantity > oldMat.quantity) {
              const increase = newMat.quantity - oldMat.quantity;
              deltaMaterials.push({
                ...newMat,
                quantity: increase
              });
            }
            // If quantity is same or less, don't re-process (already deducted before)
          }
        });

        materialsToProcess = deltaMaterials;

        if (materialsToProcess.length > 0) {

          // Procesar consumo de materiales del inventario de la cuadrilla
          try {

            if (!targetCrewId) {
              throw new Error("No se puede procesar materiales sin una cuadrilla asignada");
            }

            await processOrderUsage(
              id,
              targetCrewId,
              materialsToProcess.map((m: any) => ({
                inventoryId: (m.item && typeof m.item === 'object') ? m.item._id : (m.item || m.inventoryId),
                quantity: (m.instanceIds && m.instanceIds.length > 0) ? m.instanceIds.length : m.quantity,
                batchCode: m.batchCode,
                instanceIds: m.instanceIds
              })),
              sessionUser || undefined
            );
          } catch (materialError: any) {
            console.error("Error in processOrderUsage:", materialError);
            return NextResponse.json(
              { error: `Error al procesar materiales: ${materialError.message}` },
              { status: 400, headers: CORS_HEADERS }
            );
          }
        }
      }
    }

    // Prepare data for update - sanitize materialsUsed to ensure 'item' is an ID
    // AND remove 'instanceDetails' or other non-schema fields that might block saving
    if (data.materialsUsed && Array.isArray(data.materialsUsed)) {
      data.materialsUsed = data.materialsUsed.map((m: any) => ({
        item: (m.item && typeof m.item === 'object' && m.item._id) ? m.item._id : m.item,
        quantity: m.quantity,
        batchCode: m.batchCode,
        instanceIds: m.instanceIds // Ensure this is passed
      }));
    }

    console.log("[DEBUG] Updating Order with Data:", JSON.stringify(data.materialsUsed, null, 2));

    const updated = await updateOrder(id, data, sessionUser || undefined);

    console.log("[DEBUG] Order Updated Result:", JSON.stringify((updated as any)?.materialsUsed, null, 2));

    if (!updated)
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    return NextResponse.json(updated, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error("[DEBUG] Error in PUT:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    let bodyId = null;
    try {
      const body = await request.json();
      bodyId = body.id || body._id;
    } catch (e) {
      /* ignore */
    }
    const finalId = id || bodyId;
    if (!finalId)
      return NextResponse.json(
        { error: "id is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    const deleted = await deleteOrder(finalId);
    if (!deleted)
      return NextResponse.json(
        { error: "Not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    return NextResponse.json(
      { message: "Deleted" },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
