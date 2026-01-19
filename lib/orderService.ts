import OrderModel, { IOrder } from "@/models/Order";
import InstallerModel from "@/models/Installer"; // Registers Installer schema
import CrewModel from "@/models/Crew"; // Registers Crew schema
import InventoryModel, { IInventory } from "@/models/Inventory";
import { connectDB } from "@/lib/db";
import { createOrderHistory } from "@/lib/orderHistoryService";
import { SessionUser } from "@/lib/authHelpers";
import { notifyNewOrderAssigned, notifyOrderReassigned, notifyOrderStatusChanged } from '@/lib/pushNotificationService';
// Ensure Installer and Crew models are registered for populate
void InstallerModel;
void CrewModel;

// Función reutilizable para CREAR ordenes
export async function createOrder(data: any, sessionUser?: SessionUser) {
  await connectDB();
  // Aquí validas lógica de negocio (ej: verificar si el técnico existe)
  const newOrder = await OrderModel.create(data);
  if (newOrder.assignedTo) {
    try {
      // Determine if we should exclude an installer
      const excludeInstallerId = sessionUser?.role === 'installer' ? sessionUser.userId : undefined;

      await notifyNewOrderAssigned(
        newOrder._id.toString(),
        newOrder.assignedTo.toString(),
        {
          subscriberName: newOrder.subscriberName,
          address: newOrder.address,
          type: newOrder.type
        },
        excludeInstallerId  // ⭐ Exclude installer who created/assigned the order
      );
    } catch (err) {
      // Log but don't fail order creation
      console.error('Push notification failed:', err);
    }
  }

  // Create initial history entry with user info
  await createOrderHistory({
    order: newOrder._id,
    changeType: "created",
    newValue: {
      status: newOrder.status,
      subscriberNumber: newOrder.subscriberNumber,
    },
    description: `Orden creada - ${newOrder.subscriberName}`,
    crew: newOrder.assignedTo || undefined,
    changedBy: sessionUser?.userId,
    changedByModel: sessionUser?.userModel,
  });

  return newOrder;
}

// Función reutilizable para LISTAR ordenes
export async function getOrders(filters = {}) {
  await connectDB();
  return await OrderModel.find(filters)
    .populate('assignedTo', 'number')
    .sort({ createdAt: -1 })
    .lean();
}

// Obtener una orden por id
export async function getOrderById(id: string): Promise<IOrder | null> {
  await connectDB();
  const order = await OrderModel.findById(id)
    .populate("assignedTo", "number")
    .populate("materialsUsed.item", "code description unit type")
    .lean() as unknown as IOrder | null;

  if (!order) return null;

  // Manually populate instance details (serial numbers) for equipment
  if (order.materialsUsed && order.materialsUsed.length > 0) {
    for (const material of order.materialsUsed) {
      // Check if material has instanceIds and item is populated (has _id)
      if (material.instanceIds && material.instanceIds.length > 0 && material.item && (material.item as any)._id) {
        try {
          // Find inventory item to look up instances
          const inventory = await InventoryModel.findById((material.item as any)._id)
            .select('instances')
            .lean() as unknown as IInventory | null;

          if (inventory && inventory.instances) {
            // Map instanceIds to their details (serialNumber, etc.)
            (material as any).instanceDetails = material.instanceIds.map((id: string) => {
              const inst = inventory.instances?.find((i: any) => i.uniqueId === id);
              return {
                uniqueId: id,
                serialNumber: inst?.serialNumber || 'N/A'
              };
            });
          }
        } catch (err) {
          console.error(`Error populating instance details for material ${(material.item as any).code}:`, err);
        }
      }
    }
  }

  return order;
}

// Helper function to compare and create history entries
async function trackChanges(orderId: string, oldOrder: any, newData: any, sessionUser?: SessionUser) {
  const historyEntries = [];

  // Track status change
  if (newData.status && oldOrder.status !== newData.status) {
    historyEntries.push({
      order: orderId,
      changeType: newData.status === "completed" ? "completed" : newData.status === "cancelled" ? "cancelled" : "status_change",
      previousValue: oldOrder.status,
      newValue: newData.status,
      description: `Estado cambiado de "${oldOrder.status}" a "${newData.status}"`,
      crew: newData.assignedTo || oldOrder.assignedTo || undefined,
      changedBy: sessionUser?.userId,
      changedByModel: sessionUser?.userModel,
    });
  }

  // Track crew assignment
  if (newData.assignedTo && String(oldOrder.assignedTo) !== String(newData.assignedTo)) {
    const crew = await CrewModel.findById(newData.assignedTo).select('number').lean() as { number: number } | null;
    historyEntries.push({
      order: orderId,
      changeType: "crew_assignment",
      previousValue: oldOrder.assignedTo,
      newValue: newData.assignedTo,
      description: `Cuadrilla asignada: ${crew?.number ? `Cuadrilla ${crew.number}` : 'Desconocida'}`,
      crew: newData.assignedTo,
      changedBy: sessionUser?.userId,
      changedByModel: sessionUser?.userModel,
    });
  }

  // Track materials added (if materialsUsed is being updated)
  if (newData.materialsUsed && JSON.stringify(oldOrder.materialsUsed) !== JSON.stringify(newData.materialsUsed)) {
    historyEntries.push({
      order: orderId,
      changeType: "materials_added",
      previousValue: oldOrder.materialsUsed,
      newValue: newData.materialsUsed,
      description: `Materiales actualizados (${newData.materialsUsed?.length || 0} items)`,
      crew: newData.assignedTo || oldOrder.assignedTo || undefined,
      changedBy: sessionUser?.userId,
      changedByModel: sessionUser?.userModel,
    });
  }

  // Create all history entries
  for (const entry of historyEntries) {
    await createOrderHistory(entry);
  }
}

// Actualizar orden por id
export async function updateOrder(id: string, data: any, sessionUser?: SessionUser) {
  await connectDB();

  // Get the old order first
  const oldOrder = await OrderModel.findById(id).lean() as unknown as IOrder | null;
  if (!oldOrder) {
    throw new Error("Order not found");
  }



  // Automatically set dates based on status changes
  if (data.status === 'assigned' && !data.assignmentDate) {
    data.assignmentDate = new Date();
  }

  if (data.status === 'completed' && !data.completionDate) {
    data.completionDate = new Date();
  }

  // Track changes before updating
  await trackChanges(id, oldOrder, data, sessionUser);

  // Send notification for status changes (before update so we have old status)
  if (data.status && oldOrder.status !== data.status && (data.assignedTo || oldOrder.assignedTo)) {
    // We'll send this after the update to ensure we have the latest order data
    // Store the flag to send notification after update
  }

  // Update the order
  const updatedOrder = await OrderModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean() as unknown as IOrder | null;

  if (!updatedOrder) {
    throw new Error("Order not found after update");
  }

  // Send notifications based on what changed
  const crewChanged = data.assignedTo && oldOrder.assignedTo &&
    String(data.assignedTo) !== String(oldOrder.assignedTo);
  const statusChanged = data.status && oldOrder.status !== data.status;
  const currentCrewId = data.assignedTo || updatedOrder.assignedTo;

  // Determine if we should exclude the current user from notifications
  const excludeInstallerId = sessionUser?.role === 'installer' ? sessionUser.userId : undefined;

  if (excludeInstallerId) {
    console.log(`🔍 [orderService] Will exclude installer ${excludeInstallerId} from notifications (role: ${sessionUser?.role})`);
  }

  // Priority: If both changed, send status change notification (more relevant)
  // Otherwise send whichever one changed
  if (statusChanged && currentCrewId) {
    // Status changed - notify current crew
    try {
      await notifyOrderStatusChanged(
        id,
        currentCrewId,  // Only notify the NEW/CURRENT crew
        oldOrder.status,
        data.status,
        {
          subscriberName: updatedOrder.subscriberName,
          address: updatedOrder.address
        },
        excludeInstallerId  // Exclude installer who made the change
      );
    } catch (err) {
      console.error('Status change notification failed:', err);
    }
  } else if (crewChanged && !statusChanged) {
    // Only crew changed (no status change) - send reassignment notification
    try {
      await notifyOrderReassigned(
        id,
        String(data.assignedTo),
        {
          subscriberName: updatedOrder.subscriberName,
          address: updatedOrder.address
        },
        excludeInstallerId  // ⭐ Exclude installer who made the change
      );
    } catch (err) {
      console.error('Crew reassignment notification failed:', err);
    }
  } else if (!currentCrewId && statusChanged) {
    // Status changed but no crew assigned - skip notification
    console.log(`Order ${id} has no crew assigned, skipping status change notification`);
  }

  return updatedOrder;
}

// Eliminar orden por id
export async function deleteOrder(id: string) {
  await connectDB();
  return await OrderModel.findByIdAndDelete(id).lean();
}

