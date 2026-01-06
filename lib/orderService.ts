import OrderModel, { IOrder } from "@/models/Order";
import InstallerModel from "@/models/Installer"; // Registers Installer schema
import CrewModel from "@/models/Crew"; // Registers Crew schema
import InventoryModel, { IInventory } from "@/models/Inventory";
import { connectDB } from "@/lib/db";
import { createOrderHistory } from "@/lib/orderHistoryService";
import { SessionUser } from "@/lib/authHelpers";

// Ensure Installer and Crew models are registered for populate
void InstallerModel;
void CrewModel;

// Función reutilizable para CREAR ordenes
export async function createOrder(data: any, sessionUser?: SessionUser) {
  await connectDB();
  // Aquí validas lógica de negocio (ej: verificar si el técnico existe)
  const newOrder = await OrderModel.create(data);
  
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
    .populate('assignedTo', 'name phone')
    .sort({ createdAt: -1 })
    .lean();
}

// Obtener una orden por id
export async function getOrderById(id: string): Promise<IOrder | null> {
  await connectDB();
  const order = await OrderModel.findById(id)
    .populate("assignedTo", "name")
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
    const crewName = await CrewModel.findById(newData.assignedTo).select('name').lean() as { name: string } | null;
    historyEntries.push({
      order: orderId,
      changeType: "crew_assignment",
      previousValue: oldOrder.assignedTo,
      newValue: newData.assignedTo,
      description: `Cuadrilla asignada: ${crewName?.name || 'Desconocida'}`,
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
  const oldOrder = await OrderModel.findById(id).lean();
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
  
  return await OrderModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).lean();
}

// Eliminar orden por id
export async function deleteOrder(id: string) {
  await connectDB();
  return await OrderModel.findByIdAndDelete(id).lean();
}

