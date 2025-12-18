// lib/inventoryService.ts
// Servicio de lógica de negocio para gestión de inventario
// Maneja transacciones de reabastecimiento, asignación y consumo de materiales

import { connectDB } from "@/lib/db";
import InventoryModel from "@/models/Inventory";
import CrewModel from "@/models/Crew";
import InventoryHistoryModel from "@/models/InventoryHistory";
import InventorySnapshotModel from "@/models/InventorySnapshot";
import { SessionUser } from "@/lib/authHelpers";
import mongoose from "mongoose";

/**
 * Reabastece el inventario de bodega central
 * @param items - Array de ítems con inventoryId y quantity
 * @param reason - Motivo del reabastecimiento (ej: "Nota de Entrega #123")
 * @returns Array de ítems actualizados
 */
export async function restockInventory(
  items: { inventoryId: string; quantity: number }[],
  reason: string,
  sessionUser?: SessionUser
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedItems = [];

    for (const item of items) {
      // Incrementar el stock en bodega
      const inventoryItem = await InventoryModel.findByIdAndUpdate(
        item.inventoryId,
        { $inc: { currentStock: item.quantity } },
        { new: true, session }
      );

      if (!inventoryItem) {
        throw new Error(`Item de inventario no encontrado: ${item.inventoryId}`);
      }

      // Crear registro en historial
      await InventoryHistoryModel.create(
        [
          {
            item: item.inventoryId,
            type: "entry",
            quantityChange: item.quantity,
            reason: reason,
            performedBy: sessionUser?.userId,
            performedByModel: sessionUser?.userModel,
          },
        ],
        { session }
      );

      updatedItems.push(inventoryItem);
    }

    await session.commitTransaction();
    return updatedItems;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Asigna materiales a una cuadrilla desde bodega central
 * @param crewId - ID de la cuadrilla
 * @param items - Array de ítems con inventoryId y quantity
 * @param userId - ID del usuario que realiza la asignación
 * @returns Cuadrilla actualizada con inventario asignado
 */
export async function assignMaterialToCrew(
  crewId: string,
  items: { inventoryId: string; quantity: number }[],
  sessionUser?: SessionUser
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Verificar que hay suficiente stock en bodega
    for (const item of items) {
      const inventoryItem = await InventoryModel.findById(item.inventoryId).session(
        session
      );

      if (!inventoryItem) {
        throw new Error(`Item de inventario no encontrado: ${item.inventoryId}`);
      }

      if (inventoryItem.currentStock < item.quantity) {
        throw new Error(
          `Stock insuficiente para ${inventoryItem.description}. ` +
            `Disponible: ${inventoryItem.currentStock}, Solicitado: ${item.quantity}`
        );
      }
    }

    // 2. Restar del inventario de bodega
    for (const item of items) {
      await InventoryModel.findByIdAndUpdate(
        item.inventoryId,
        { $inc: { currentStock: -item.quantity } },
        { session }
      );
    }

    // 3. Actualizar inventario de la cuadrilla (lógica de upsert)
    const crew = await CrewModel.findById(crewId).session(session);
    if (!crew) {
      throw new Error(`Cuadrilla no encontrada: ${crewId}`);
    }

    for (const item of items) {
      // Buscar si el ítem ya existe en assignedInventory
      const existingItemIndex = crew.assignedInventory.findIndex(
        (inv: any) => inv.item.toString() === item.inventoryId
      );

      if (existingItemIndex >= 0) {
        // Si existe, sumar la cantidad
        crew.assignedInventory[existingItemIndex].quantity += item.quantity;
        crew.assignedInventory[existingItemIndex].lastUpdate = new Date();
      } else {
        // Si no existe, añadir nuevo ítem
        crew.assignedInventory.push({
          item: new mongoose.Types.ObjectId(item.inventoryId),
          quantity: item.quantity,
          lastUpdate: new Date(),
        });
      }

      // 4. Crear registro en historial
      await InventoryHistoryModel.create(
        [
          {
            item: item.inventoryId,
            type: "assignment",
            quantityChange: -item.quantity, // Negativo porque sale de bodega
            reason: `Asignado a cuadrilla ${crew.name}`,
            crew: crewId,
            performedBy: sessionUser?.userId,
            performedByModel: sessionUser?.userModel,
          },
        ],
        { session }
      );
    }

    await crew.save({ session });
    await session.commitTransaction();

    return crew;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Devuelve materiales de una cuadrilla al almacén central
 * @param crewId - ID de la cuadrilla
 * @param items - Array de ítems con inventoryId y quantity
 * @param reason - Motivo de la devolución
 * @param userId - ID del usuario que realiza la devolución (opcional)
 * @returns Cuadrilla actualizada con inventario reducido
 */
export async function returnMaterialFromCrew(
  crewId: string,
  items: { inventoryId: string; quantity: number }[],
  reason: string,
  sessionUser?: SessionUser
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Obtener la cuadrilla
    const crew = await CrewModel.findById(crewId).session(session);
    if (!crew) {
      throw new Error(`Cuadrilla no encontrada: ${crewId}`);
    }

    // 2. Validar y procesar cada ítem
    for (const item of items) {
      // Buscar el ítem en el inventario de la cuadrilla
      const itemIndex = crew.assignedInventory.findIndex(
        (inv: any) => inv.item.toString() === item.inventoryId
      );

      if (itemIndex < 0) {
        const inventoryItem = await InventoryModel.findById(item.inventoryId);
        throw new Error(
          `La cuadrilla no tiene asignado el material: ${
            inventoryItem?.description || item.inventoryId
          }`
        );
      }

      // Verificar que tenga suficiente cantidad
      if (crew.assignedInventory[itemIndex].quantity < item.quantity) {
        const inventoryItem = await InventoryModel.findById(item.inventoryId);
        throw new Error(
          `Cantidad insuficiente de ${inventoryItem?.description || "material"}. ` +
            `Disponible: ${crew.assignedInventory[itemIndex].quantity}, ` +
            `Solicitado: ${item.quantity}`
        );
      }

      // 3. Restar del inventario de la cuadrilla
      crew.assignedInventory[itemIndex].quantity -= item.quantity;
      crew.assignedInventory[itemIndex].lastUpdate = new Date();

      // Si la cantidad llega a 0, eliminar el ítem del array
      if (crew.assignedInventory[itemIndex].quantity === 0) {
        crew.assignedInventory.splice(itemIndex, 1);
      }

      // 4. Incrementar en el inventario de bodega
      await InventoryModel.findByIdAndUpdate(
        item.inventoryId,
        { $inc: { currentStock: item.quantity } },
        { session }
      );

      // 5. Crear registro en historial
      await InventoryHistoryModel.create(
        [
          {
            item: item.inventoryId,
            type: "return",
            quantityChange: item.quantity, // Positivo porque regresa al almacén
            reason: reason,
            crew: crewId,
            performedBy: sessionUser?.userId,
            performedByModel: sessionUser?.userModel,
          },
        ],
        { session }
      );
    }

    await crew.save({ session });
    await session.commitTransaction();

    return crew;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Procesa el consumo de materiales al completar una orden
 * @param orderId - ID de la orden completada
 * @param crewId - ID de la cuadrilla que realizó el trabajo
 * @param materials - Array de materiales usados con inventoryId y quantity
 * @returns Confirmación de procesamiento
 */
export async function processOrderUsage(
  orderId: string,
  crewId: string,
  materials: { inventoryId: string; quantity: number }[],
  sessionUser?: SessionUser
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const crew = await CrewModel.findById(crewId).session(session);
    if (!crew) {
      throw new Error(`Cuadrilla no encontrada: ${crewId}`);
    }

    // Procesar cada material usado
    for (const material of materials) {
      // Buscar el ítem en el inventario de la cuadrilla
      const itemIndex = crew.assignedInventory.findIndex(
        (inv: any) => inv.item.toString() === material.inventoryId
      );

      if (itemIndex < 0) {
        throw new Error(
          `La cuadrilla no tiene asignado el material: ${material.inventoryId}`
        );
      }

      // Verificar que tenga suficiente cantidad
      if (crew.assignedInventory[itemIndex].quantity < material.quantity) {
        const item = await InventoryModel.findById(material.inventoryId);
        throw new Error(
          `Cantidad insuficiente de ${item?.description || "material"}. ` +
            `Disponible: ${crew.assignedInventory[itemIndex].quantity}, ` +
            `Solicitado: ${material.quantity}`
        );
      }

      // Restar la cantidad
      crew.assignedInventory[itemIndex].quantity -= material.quantity;
      crew.assignedInventory[itemIndex].lastUpdate = new Date();

      // Si la cantidad llega a 0, eliminar el ítem del array
      if (crew.assignedInventory[itemIndex].quantity === 0) {
        crew.assignedInventory.splice(itemIndex, 1);
      }

      // Crear registro en historial
      await InventoryHistoryModel.create(
        [
          {
            item: material.inventoryId,
            type: "usage_order",
            quantityChange: -material.quantity,
            reason: `Usado en orden ${orderId}`,
            crew: crewId,
            order: orderId,
            performedBy: sessionUser?.userId,
            performedByModel: sessionUser?.userModel,
          },
        ],
        { session }
      );
    }

    await crew.save({ session });
    await session.commitTransaction();

    return {
      success: true,
      message: "Materiales consumidos correctamente",
      crewId,
      orderId,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Obtiene los ítems de inventario con filtros opcionales
 * @param filters - Filtros opcionales (search, type, lowStock)
 * @returns Array de ítems de inventario
 */
export async function getInventoryItems(filters: {
  search?: string;
  type?: string;
  lowStock?: boolean;
} = {}) {
  await connectDB();

  const query: any = {};

  if (filters.search) {
    query.$or = [
      { code: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } },
    ];
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.lowStock) {
    query.$expr = { $lt: ["$currentStock", "$minimumStock"] };
  }

  return await InventoryModel.find(query).sort({ code: 1 }).lean();
}

/**
 * Obtiene el inventario asignado a una cuadrilla específica
 * @param crewId - ID de la cuadrilla
 * @returns Inventario de la cuadrilla con datos poblados
 */
export async function getCrewInventory(crewId: string) {
  await connectDB();

  const crew = await CrewModel.findById(crewId)
    .populate("assignedInventory.item", "code description unit")
    .lean();

  if (!crew || Array.isArray(crew)) {
    throw new Error(`Cuadrilla no encontrada: ${crewId}`);
  }

  return crew.assignedInventory;
}

/**
 * Obtiene el historial de movimientos de inventario con filtros
 * @param filters - Filtros opcionales
 * @returns Array de registros de historial
 */
export async function getInventoryHistory(filters: {
  crewId?: string;
  itemId?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
} = {}) {
  await connectDB();

  const query: any = {};

  if (filters.crewId) query.crew = filters.crewId;
  if (filters.itemId) query.item = filters.itemId;
  if (filters.type) query.type = filters.type;

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = filters.startDate;
    if (filters.endDate) query.createdAt.$lte = filters.endDate;
  }

  return await InventoryHistoryModel.find(query)
    .populate("item", "code description")
    .populate("crew", "name")
    .populate("order", "subscriberNumber")
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Crea un snapshot del estado actual del inventario
 * Captura inventario de bodega y de todas las cuadrillas
 * @returns Snapshot creado
 */
export async function createDailySnapshot() {
  await connectDB();

  try {
    // 1. Obtener todo el inventario de bodega con stock > 0
    const warehouseItems = await InventoryModel.find({
      currentStock: { $gt: 0 },
    }).lean();

    const warehouseInventory = warehouseItems.map((item) => ({
      item: item._id,
      quantity: item.currentStock,
      code: item.code,
      description: item.description,
    }));

    // 2. Obtener todas las cuadrillas activas con inventario asignado
    const crews = await CrewModel.find({ isActive: true })
      .populate("assignedInventory.item", "code description")
      .lean();

    const crewInventories = crews
      .filter((crew: any) => crew.assignedInventory && crew.assignedInventory.length > 0)
      .map((crew: any) => ({
        crew: crew._id,
        crewName: crew.name,
        items: crew.assignedInventory.map((inv: any) => ({
          item: inv.item._id,
          quantity: inv.quantity,
          code: inv.item.code,
          description: inv.item.description,
        })),
      }));

    // 3. Calcular metadatos
    const totalItems = new Set([
      ...warehouseItems.map((i: any) => i._id.toString()),
      ...crews.flatMap((c: any) =>
        (c.assignedInventory || []).map((i: any) => i.item.toString())
      ),
    ]).size;

    const totalWarehouseStock = warehouseItems.reduce(
      (sum, item) => sum + item.currentStock,
      0
    );

    // 4. Crear el snapshot
    const snapshot = await InventorySnapshotModel.create({
      snapshotDate: new Date(),
      warehouseInventory,
      crewInventories,
      totalItems,
      totalWarehouseStock,
    });

    return snapshot;
  } catch (error) {
    console.error("Error al crear snapshot diario:", error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de uso de materiales entre dos fechas
 * @param startDate - Fecha de inicio
 * @param endDate - Fecha de fin
 * @param filters - Filtros adicionales (crewId, itemId)
 * @returns Estadísticas calculadas
 */
export async function getInventoryStatistics(
  startDate: Date,
  endDate: Date,
  filters: { crewId?: string; itemId?: string } = {}
) {
  await connectDB();

  try {
    // 1. Calcular métricas básicas del inventario actual
    const allItems = await InventoryModel.find().lean();
    
    const totalItems = allItems.length;
    const criticalStock = allItems.filter(
      (item) => item.currentStock <= item.minimumStock * 0.5
    ).length;
    const totalWarehouseStock = allItems.reduce(
      (sum, item) => sum + item.currentStock,
      0
    );

    // 2. Obtener historial de movimientos en el rango
    const historyQuery: any = {
      createdAt: { $gte: startDate, $lte: endDate },
    };
    if (filters.crewId) historyQuery.crew = filters.crewId;
    if (filters.itemId) historyQuery.item = filters.itemId;

    const movements = await InventoryHistoryModel.find(historyQuery)
      .populate("item", "code description")
      .populate("crew", "name")
      .lean();

    // 3. Agrupar movimientos por tipo
    const movementsByType = movements.reduce((acc: any, mov: any) => {
      if (!acc[mov.type]) acc[mov.type] = [];
      acc[mov.type].push(mov);
      return acc;
    }, {});

    // 4. Calcular totales de uso
    const materialUsage = movements
      .filter((m: any) => m.type === "usage_order")
      .reduce((acc: any, mov: any) => {
        const itemId = mov.item._id.toString();
        if (!acc[itemId]) {
          acc[itemId] = {
            item: mov.item,
            totalUsed: 0,
            usageCount: 0,
          };
        }
        acc[itemId].totalUsed += Math.abs(mov.quantityChange);
        acc[itemId].usageCount += 1;
        return acc;
      }, {});

    // 5. Intentar obtener snapshots (opcional)
    const snapshots = await InventorySnapshotModel.find({
      snapshotDate: { $gte: startDate, $lte: endDate },
    })
      .sort({ snapshotDate: 1 })
      .lean();

    return {
      period: { start: startDate, end: endDate },
      // Métricas básicas del inventario actual
      totalItems,
      criticalStock,
      totalWarehouseStock,
      // Métricas de movimientos
      totalMovements: movements.length,
      movementsByType: Object.keys(movementsByType).map((type) => ({
        type,
        count: movementsByType[type].length,
      })),
      materialUsage: Object.values(materialUsage),
      // Snapshots (si están disponibles)
      snapshotsCount: snapshots.length,
      snapshots: snapshots.map((s) => ({
        date: s.snapshotDate,
        warehouseStock: s.totalWarehouseStock,
        crewsWithInventory: s.crewInventories.length,
      })),
    };
  } catch (error) {
    console.error("Error al calcular estadísticas:", error);
    throw error;
  }
}

/**
 * Crea un nuevo ítem de inventario
 * @param data - Datos del ítem a crear
 * @returns Ítem creado
 */
export async function createInventory(data: any) {
  await connectDB();
  const item = await InventoryModel.create(data);
  return item;
}

/**
 * Obtiene todos los ítems de inventario
 * @returns Array de ítems de inventario
 */
export async function getInventories() {
  await connectDB();
  return await InventoryModel.find().sort({ code: 1 }).lean();
}

/**
 * Obtiene un ítem de inventario por su ID
 * @param id - ID del ítem
 * @returns Ítem encontrado o null
 */
export async function getInventoryById(id: string) {
  await connectDB();
  return await InventoryModel.findById(id).lean();
}

/**
 * Actualiza un ítem de inventario
 * @param id - ID del ítem a actualizar
 * @param data - Datos a actualizar
 * @returns Ítem actualizado o null
 */
export async function updateInventory(id: string, data: any) {
  await connectDB();
  return await InventoryModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
}

/**
 * Elimina un ítem de inventario
 * @param id - ID del ítem a eliminar
 * @returns Ítem eliminado o null
 */
export async function deleteInventory(id: string) {
  await connectDB();
  return await InventoryModel.findByIdAndDelete(id).lean();
}

// ============================================================================
// BATCH/BOBBIN MANAGEMENT FUNCTIONS
// ============================================================================

import InventoryBatchModel from "@/models/InventoryBatch";

/**
 * Crea un nuevo lote/bobina
 * @param data - Datos del lote (batchCode, inventoryId, initialQuantity, etc.)
 * @param sessionUser - Usuario que crea el lote
 * @returns Lote creado
 */
export async function createBatch(
  data: {
    batchCode: string;
    inventoryId: string;
    initialQuantity: number;
    unit?: string;
    supplier?: string;
    acquisitionDate?: Date;
    notes?: string;
  },
  sessionUser?: SessionUser
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verificar que el ítem de inventario existe
    const inventoryItem = await InventoryModel.findById(data.inventoryId).session(
      session
    );

    if (!inventoryItem) {
      throw new Error(`Item de inventario no encontrado: ${data.inventoryId}`);
    }

    // Crear el lote
    const [batch] = await InventoryBatchModel.create(
      [
        {
          batchCode: data.batchCode.toUpperCase(),
          item: data.inventoryId,
          initialQuantity: data.initialQuantity,
          currentQuantity: data.initialQuantity,
          unit: data.unit || inventoryItem.unit || "metros",
          supplier: data.supplier || "Netuno",
          acquisitionDate: data.acquisitionDate || new Date(),
          notes: data.notes,
          location: "warehouse",
          status: "active",
        },
      ],
      { session }
    );

    // Incrementar el stock en bodega
    await InventoryModel.findByIdAndUpdate(
      data.inventoryId,
      { $inc: { currentStock: data.initialQuantity } },
      { session }
    );

    // Crear registro en historial
    await InventoryHistoryModel.create(
      [
        {
          item: data.inventoryId,
          batch: batch._id,
          type: "entry",
          quantityChange: data.initialQuantity,
          reason: `Ingreso de lote ${data.batchCode}`,
          performedBy: sessionUser?.userId,
          performedByModel: sessionUser?.userModel,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return batch;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Obtiene lotes/bobinas con filtros opcionales
 * @param filters - Filtros (itemId, location, crewId, status, batchCode)
 * @returns Array de lotes
 */
export async function getBatches(filters: {
  itemId?: string;
  location?: "warehouse" | "crew";
  crewId?: string;
  status?: "active" | "depleted" | "returned";
  batchCode?: string;
} = {}) {
  await connectDB();

  const query: any = {};

  if (filters.itemId) query.item = filters.itemId;
  if (filters.location) query.location = filters.location;
  if (filters.crewId) query.crew = filters.crewId;
  if (filters.status) query.status = filters.status;
  if (filters.batchCode) {
    query.batchCode = { $regex: filters.batchCode, $options: "i" };
  }

  return await InventoryBatchModel.find(query)
    .populate("item", "code description unit")
    .populate("crew", "name")
    .sort({ batchCode: 1 })
    .lean();
}

/**
 * Asigna metros adicionales a una bobina existente
 * @param batchCode - Código del lote
 * @param metersToAdd - Metros a añadir
 * @param sessionUser - Usuario que realiza la operación
 * @returns Lote actualizado
 */
export async function assignMetersToBatch(
  batchCode: string,
  metersToAdd: number,
  sessionUser?: SessionUser
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Obtener el lote
    const batch = await InventoryBatchModel.findOne({
      batchCode: batchCode.toUpperCase(),
    }).session(session);

    if (!batch) {
      throw new Error(`Lote no encontrado: ${batchCode}`);
    }

    if (batch.status === "depleted") {
      throw new Error("No se pueden añadir metros a una bobina agotada");
    }

    // Actualizar cantidad
    batch.currentQuantity += metersToAdd;
    if (batch.status === "depleted" && batch.currentQuantity > 0) {
      batch.status = "active";
    }
    await batch.save({ session });

    // Incrementar stock en bodega
    await InventoryModel.findByIdAndUpdate(
      batch.item,
      { $inc: { currentStock: metersToAdd } },
      { session }
    );

    // Crear registro en historial
    await InventoryHistoryModel.create(
      [
        {
          item: batch.item,
          batch: batch._id,
          type: "entry",
          quantityChange: metersToAdd,
          reason: `Metros añadidos a lote ${batchCode}`,
          performedBy: sessionUser?.userId,
          performedByModel: sessionUser?.userModel,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return batch;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Elimina una bobina agotada
 * @param batchCode - Código del lote a eliminar
 * @param sessionUser - Usuario que realiza la eliminación
 * @returns Lote eliminado
 */
export async function deleteBatch(
  batchCode: string,
  sessionUser?: SessionUser
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Obtener el lote
    const batch = await InventoryBatchModel.findOne({
      batchCode: batchCode.toUpperCase(),
    }).session(session);

    if (!batch) {
      throw new Error(`Lote no encontrado: ${batchCode}`);
    }

    // Solo permitir eliminar bobinas agotadas o con cantidad 0
    if (batch.currentQuantity > 0 && batch.status !== "depleted") {
      throw new Error(
        "Solo se pueden eliminar bobinas agotadas (0 metros restantes)"
      );
    }

    // Marcar como agotado en lugar de eliminar (para historial)
    batch.status = "depleted";
    batch.currentQuantity = 0;
    await batch.save({ session });

    // Crear registro en historial
    await InventoryHistoryModel.create(
      [
        {
          item: batch.item,
          batch: batch._id,
          type: "adjustment",
          quantityChange: 0,
          reason: `Bobina ${batchCode} marcada como agotada y eliminada`,
          performedBy: sessionUser?.userId,
          performedByModel: sessionUser?.userModel,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return batch;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
