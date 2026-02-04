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

  // Validar ticket duplicado si se proporciona ticket_id
  if (data.ticket_id && data.ticket_id.trim()) {
    const existingOrder = await OrderModel.findOne({
      ticket_id: data.ticket_id.trim()
    }).lean();

    if (existingOrder) {
      throw new Error(`El ticket "${data.ticket_id}" ya existe en el sistema. Por favor, utiliza un ticket diferente o déjalo vacío.`);
    }
  }

  // Sanitize ticket_id: convert empty string to null
  if (data.ticket_id !== undefined && (!data.ticket_id || data.ticket_id.trim() === '')) {
    data.ticket_id = null;
  }

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
export async function getOrders(filters = {}, projection: any = null) {
  await connectDB();
  const orders = await OrderModel.find(filters, projection)
    .populate({
      path: 'assignedTo',
      select: 'number leader',
      populate: {
        path: 'leader',
        select: 'name surname'
      }
    })
    .populate('materialsUsed.item', 'code description unit type')
    .sort({ createdAt: -1 })
    .lean();

  // Manually populate instance details (serial numbers) for equipment in List View
  // This is needed for reports that rely on the list endpoint
  for (const order of orders) {
    if (order.materialsUsed && order.materialsUsed.length > 0) {
      for (const material of order.materialsUsed) {
        if (material.instanceIds && material.instanceIds.length > 0 && material.item && (material.item as any)._id) {
          try {
            const inventory = await InventoryModel.findById((material.item as any)._id)
              .select('instances')
              .lean() as unknown as IInventory | null;

            if (inventory && inventory.instances) {
              (material as any).instanceDetails = material.instanceIds.map((id: string) => {
                const inst = inventory.instances?.find((i: any) => i.uniqueId === id);
                return {
                  uniqueId: id,
                  serialNumber: inst?.serialNumber || 'N/A'
                };
              });
            }
          } catch (err) {
            // calculated field, ignore error
          }
        }
      }
    }
  }

  return orders;
}

// Obtener una orden por id
export async function getOrderById(id: string): Promise<IOrder | null> {
  await connectDB();
  const order = await OrderModel.findById(id)
    .populate({
      path: "assignedTo",
      select: "number leader",
      populate: {
        path: "leader",
        select: "name surname"
      }
    })
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

  // --- LOGIC FOR VISIT COUNTING ---
  // Check if interaction counts as a visit (Status "hard" or "visita" AND new log entry added)
  // We compare the length of installerLog to detect if a new entry was pushed.
  // Note: This relies on the frontend pushing the log entry in the update payload.

  const oldLogCount = oldOrder.installerLog ? oldOrder.installerLog.length : 0;
  const newLogCount = (data.installerLog && Array.isArray(data.installerLog)) ? data.installerLog.length : 0;

  const isHardOrVisita = data.status === 'hard' || data.status === 'visita';
  const hasNewLogEntry = newLogCount > oldLogCount;

  if (isHardOrVisita && hasNewLogEntry) {
    const currentCount = oldOrder.visitCount || 0;
    data.visitCount = currentCount + 1;
    console.log(`[Visit Counter] Incrementing visit count for order ${id}. New count: ${data.visitCount}`);
  }
  // --------------------------------

  // Track changes before updating
  await trackChanges(id, oldOrder, data, sessionUser);

  // Send notification for status changes (before update so we have old status)
  if (data.status && oldOrder.status !== data.status && (data.assignedTo || oldOrder.assignedTo)) {
    // We'll send this after the update to ensure we have the latest order data
    // Store the flag to send notification after update
  }

  // Sanitize ticket_id: convert empty string to null to avoid duplicate key errors
  // MongoDB's sparse index allows multiple null values but not multiple empty strings
  if (data.ticket_id !== undefined && (!data.ticket_id || data.ticket_id.trim() === '')) {
    data.ticket_id = null;
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

// Función manual para sincronizar con Netuno (n8n)
export async function syncOrderToNetuno(id: string, certificateUrlOverride?: string) {
  await connectDB();

  if (!process.env.N8N_WEBHOOK_URL) {
    throw new Error('N8N_WEBHOOK_URL is not defined in .env');
  }

  // Fetch order with crew and installers populated
  const order = await OrderModel.findById(id)
    .populate({
      path: 'assignedTo',
      populate: [
        {
          path: 'leader',
          select: 'name surname'
        },
        {
          path: 'members',
          select: 'name surname'
        }
      ]
    })
    .populate('materialsUsed.item', 'code description unit type')
    .lean() as unknown as IOrder | null;

  if (!order) {
    throw new Error("Order not found");
  }

  console.log(`🚀 Manually triggering n8n webhook for order ${id}...`);

  // Helper function to format timestamp to DD/MM/YYYY HH:MM GMT-4
  const formatTimestamp = (date: Date | string) => {
    const d = new Date(date);

    // Convert to GMT-4 (Venezuela time)
    const offset = -4 * 60; // GMT-4 in minutes
    const localTime = new Date(d.getTime() + offset * 60 * 1000);

    const day = String(localTime.getUTCDate()).padStart(2, '0');
    const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
    const year = localTime.getUTCFullYear();
    const hours = String(localTime.getUTCHours()).padStart(2, '0');
    const minutes = String(localTime.getUTCMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Build simplified payload
  const payload: any = {
    timestamp: formatTimestamp(order.updatedAt || new Date()),
    ticket_id: order.ticket_id || order.subscriberNumber,
    certificateUrl: certificateUrlOverride || order.certificateUrl || '',
    type: order.type || 'instalacion',
  };

  // Extract leader name from crew (only leader, not all members)
  if (order.assignedTo && typeof order.assignedTo === 'object') {
    const crew = order.assignedTo as any;

    // Get leader name
    if (crew.leader && typeof crew.leader === 'object') {
      const leaderName = `${crew.leader.name || ''} ${crew.leader.surname || ''}`.trim();
      payload.technician = leaderName || `Cuadrilla ${crew.number || 'Sin asignar'}`;
    } else {
      payload.technician = `Cuadrilla ${crew.number || 'Sin asignar'}`;
    }
  } else {
    payload.technician = 'Sin asignar';
  }

  // Process materials
  if (order.materialsUsed && Array.isArray(order.materialsUsed)) {
    order.materialsUsed.forEach((material: any) => {
      const item = material.item;

      if (!item || typeof item === 'string') return;

      const code = item.code;
      const quantity = material.quantity;
      const itemType = item.type;
      const description = item.description;

      // Equipment -> ONT field with description
      if (itemType === 'equipment') {
        payload.ont = description || code;
      }
      // Bobbin (fiber) -> extract description, meters, and batchCode
      else if (itemType === 'bobbin' || material.batchCode) {
        payload.fiberDescription = description || 'Fibra óptica';
        payload.fiberMeters = quantity;
        payload.batchCode = material.batchCode || '';
      }
      // Regular material -> code as key, quantity as value
      else {
        // Ensure code is trimmed to avoid key mismatch
        let cleanCode = code.trim();

        // Fix specific known issue with Rj-45 where DB might differ from Spreadsheet expectation
        if (cleanCode.includes('805-2069')) {
          cleanCode = 'Rj-45 (805-2069)';
        }

        payload[cleanCode] = quantity;
      }
    });
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (process.env.N8N_AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.N8N_AUTH_TOKEN}`;
    }

    const response = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`✅ Webhook sent to n8n for order ${order.ticket_id || id}. Status: ${response.status}`);

      // Marcar como enviado a Netuno
      await OrderModel.findByIdAndUpdate(id, { $set: { sentToNetuno: true } });

      return { success: true, status: response.status };
    } else {
      const errorText = await response.text();
      console.error(`⚠️ n8n returned error status: ${response.status} ${errorText}`);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('❌ Error sending webhook to n8n:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
