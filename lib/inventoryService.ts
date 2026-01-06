// lib/inventoryService.ts
// Servicio de lógica de negocio para gestión de inventario
// Maneja transacciones de reabastecimiento, asignación y consumo de materiales

import { connectDB } from "@/lib/db";
import InventoryModel from "@/models/Inventory";
import CrewModel from "@/models/Crew";
import InventoryHistoryModel from "@/models/InventoryHistory";
import InventorySnapshotModel from "@/models/InventorySnapshot";
import InventoryBatchModel from "@/models/InventoryBatch";
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

    // Validar que ningún ítem sea de tipo equipo
    for (const item of items) {
      const inventoryItem = await InventoryModel.findById(item.inventoryId).session(session);
      
      if (!inventoryItem) {
        throw new Error(`Item de inventario no encontrado: ${item.inventoryId}`);
      }
      
      if (inventoryItem.type === "equipment") {
        throw new Error(
          `El ítem "${inventoryItem.description}" es un equipo y no puede reabastecerse por cantidad. ` +
          `Use el endpoint /api/web/inventory/instances para agregar instancias de equipos.`
        );
      }
    }

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
 * @param items - Array de ítems con inventoryId, quantity y opcionalmente batchCode o instanceIds
 * @param sessionUser - Usuario que realiza la asignación
 * @returns Cuadrilla actualizada con inventario asignado
 */
export async function assignMaterialToCrew(
  crewId: string,
  items: { inventoryId: string; quantity: number; batchCode?: string; instanceIds?: string[] }[],
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

    for (const item of items) {
      // If batchCode is provided, handle as bobbin assignment
      if (item.batchCode) {
        // Find the batch
        const batch = await InventoryBatchModel.findOne({
          batchCode: item.batchCode.toUpperCase(),
        }).session(session);

        if (!batch) {
          throw new Error(`Bobina no encontrada: ${item.batchCode}`);
        }

        if (batch.location !== "warehouse") {
          throw new Error(`Bobina ${item.batchCode} no está en almacén`);
        }

        if (batch.status !== "active") {
          throw new Error(`Bobina ${item.batchCode} no está activa`);
        }

        // Transfer bobbin to crew
        batch.location = "crew";
        batch.crew = new mongoose.Types.ObjectId(crewId);
        await batch.save({ session });

        // IMPORTANT: Also deduct from parent inventory item's currentStock
        await InventoryModel.findByIdAndUpdate(
          item.inventoryId,
          { $inc: { currentStock: -batch.currentQuantity } },
          { session }
        );

        // Add to crew's assigned inventory
        const existingItemIndex = crew.assignedInventory.findIndex(
          (inv: any) => inv.item.toString() === item.inventoryId
        );

        if (existingItemIndex >= 0) {
          crew.assignedInventory[existingItemIndex].quantity += batch.currentQuantity;
          crew.assignedInventory[existingItemIndex].lastUpdate = new Date();
        } else {
          crew.assignedInventory.push({
            item: new mongoose.Types.ObjectId(item.inventoryId),
            quantity: batch.currentQuantity,
            lastUpdate: new Date(),
          });
        }

        // Create history record for bobbin assignment
        await InventoryHistoryModel.create(
          [
            {
              item: item.inventoryId,
              batch: batch._id,
              type: "assignment",
              quantityChange: -batch.currentQuantity,
              reason: `Bobina ${item.batchCode} asignada a cuadrilla ${crew.name}`,
              crew: crewId,
              performedBy: sessionUser?.userId,
              performedByModel: sessionUser?.userModel,
            },
          ],
          { session }
        );
      } else if ((item as any).instanceIds && (item as any).instanceIds.length > 0) {
        // Handle equipment instance assignment
        const inventoryItem = await InventoryModel.findById(item.inventoryId).session(session);

        if (!inventoryItem) {
          throw new Error(`Item de inventario no encontrado: ${item.inventoryId}`);
        }

        if (inventoryItem.type !== "equipment") {
          throw new Error(
            `El ítem "${inventoryItem.description}" no es un equipo. Use cantidad en lugar de instanceIds.`
          );
        }

        const instanceIds = (item as any).instanceIds as string[];

        // Validate and assign each instance
        for (const instanceId of instanceIds) {
          const instance = inventoryItem.instances.find(
            (inst: any) => inst.uniqueId === instanceId
          );

          if (!instance) {
            throw new Error(`Instancia ${instanceId} no encontrada en ${inventoryItem.description}`);
          }

          if (instance.status !== 'in-stock') {
            throw new Error(
              `Instancia ${instanceId} no está disponible (estado: ${instance.status})`
            );
          }

          // Update instance
          instance.status = 'assigned';
          instance.assignedTo = {
            crewId: new mongoose.Types.ObjectId(crewId),
            assignedAt: new Date(),
          };
        }

        // Save the inventory item with updated instances
        await inventoryItem.save({ session });

        // Update crew's assigned inventory
        const existingItemIndex = crew.assignedInventory.findIndex(
          (inv: any) => inv.item.toString() === item.inventoryId
        );

        if (existingItemIndex >= 0) {
          crew.assignedInventory[existingItemIndex].quantity += instanceIds.length;
          crew.assignedInventory[existingItemIndex].lastUpdate = new Date();
        } else {
          crew.assignedInventory.push({
            item: new mongoose.Types.ObjectId(item.inventoryId),
            quantity: instanceIds.length,
            lastUpdate: new Date(),
          });
        }

        // Create history record
        await InventoryHistoryModel.create(
          [
            {
              item: item.inventoryId,
              type: "assignment",
              quantityChange: -instanceIds.length,
              reason: `${instanceIds.length} instancia(s) de ${inventoryItem.description} asignada(s) a cuadrilla ${crew.name}`,
              crew: crewId,
              performedBy: sessionUser?.userId,
              performedByModel: sessionUser?.userModel,
              metadata: {
                instanceIds: instanceIds,
              },
            },
          ],
          { session }
        );
      } else {
        // Regular inventory item assignment (existing logic)
        const inventoryItem = await InventoryModel.findById(item.inventoryId).session(
          session
        );

        if (!inventoryItem) {
          throw new Error(`Item de inventario no encontrado: ${item.inventoryId}`);
        }

        // Validar que no sea equipo
        if (inventoryItem.type === "equipment") {
          throw new Error(
            `El ítem "${inventoryItem.description}" es un equipo y debe asignarse por instancias específicas. ` +
            `No se puede asignar por cantidad.`
          );
        }

        if (inventoryItem.currentStock < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${inventoryItem.description}. ` +
              `Disponible: ${inventoryItem.currentStock}, Solicitado: ${item.quantity}`
          );
        }

        // Deduct from warehouse
        await InventoryModel.findByIdAndUpdate(
          item.inventoryId,
          { $inc: { currentStock: -item.quantity } },
          { session }
        );

        // Add to crew's assigned inventory
        const existingItemIndex = crew.assignedInventory.findIndex(
          (inv: any) => inv.item.toString() === item.inventoryId
        );

        if (existingItemIndex >= 0) {
          crew.assignedInventory[existingItemIndex].quantity += item.quantity;
          crew.assignedInventory[existingItemIndex].lastUpdate = new Date();
        } else {
          crew.assignedInventory.push({
            item: new mongoose.Types.ObjectId(item.inventoryId),
            quantity: item.quantity,
            lastUpdate: new Date(),
          });
        }

        // Create history record
        await InventoryHistoryModel.create(
          [
            {
              item: item.inventoryId,
              type: "assignment",
              quantityChange: -item.quantity,
              reason: `Asignado a cuadrilla ${crew.name}`,
              crew: crewId,
              performedBy: sessionUser?.userId,
              performedByModel: sessionUser?.userModel,
            },
          ],
          { session }
        );
      }
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
 * @param materials - Array de materiales usados con inventoryId, quantity y opcionalmente batchCode
 * @returns Confirmación de procesamiento
 */
export async function processOrderUsage(
  orderId: string,
  crewId: string,
  materials: { inventoryId: string; quantity: number; batchCode?: string; instanceIds?: string[] }[],
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
      // Si tiene batchCode, es una bobina - manejar diferente
      if (material.batchCode) {
        // Buscar la bobina específica
        const batch = await InventoryBatchModel.findOne({
          batchCode: material.batchCode.toUpperCase(),
          crew: crewId,
        }).session(session);

        if (!batch) {
          throw new Error(
            `Bobina ${material.batchCode} no encontrada para esta cuadrilla`
          );
        }

        if (batch.currentQuantity < material.quantity) {
          throw new Error(
            `Metros insuficientes en bobina ${material.batchCode}. ` +
              `Disponibles: ${batch.currentQuantity}m, Solicitados: ${material.quantity}m`
          );
        }

        // Descontar metros de la bobina
        batch.currentQuantity -= material.quantity;

        // Marcar como agotada si no quedan metros
        if (batch.currentQuantity <= 0) {
          batch.status = "depleted";
          batch.currentQuantity = 0;
        }

        await batch.save({ session });

        // También descontar del inventario de la cuadrilla
        const itemIndex = crew.assignedInventory.findIndex(
          (inv: any) => inv.item.toString() === material.inventoryId
        );

        if (itemIndex >= 0) {
          crew.assignedInventory[itemIndex].quantity -= material.quantity;
          crew.assignedInventory[itemIndex].lastUpdate = new Date();

          if (crew.assignedInventory[itemIndex].quantity <= 0) {
            crew.assignedInventory.splice(itemIndex, 1);
          }
        }

        // Crear registro en historial con referencia a batch
        await InventoryHistoryModel.create(
          [
            {
              item: material.inventoryId,
              batch: batch._id,
              type: "usage_order",
              quantityChange: -material.quantity,
              reason: `Bobina ${material.batchCode}: ${material.quantity}m usados en orden ${orderId}`,
              crew: crewId,
              order: orderId,
              performedBy: sessionUser?.userId,
              performedByModel: sessionUser?.userModel,
            },
          ],
          { session }
        );
      } else if (material.instanceIds && material.instanceIds.length > 0) {
        // Manejar instancias de equipos
        const inventoryItem = await InventoryModel.findById(material.inventoryId).session(session);
        
        if (!inventoryItem) {
          throw new Error(`Item de inventario no encontrado: ${material.inventoryId}`);
        }
        
        if (inventoryItem.type !== "equipment") {
           // Si envían instanceIds pero no es equipo, advertir o tratar normal?
           // Por integridad, requerimos que coincida
           throw new Error(`El ítem "${inventoryItem.description}" no es un equipo.`);
        }

        // Marcar cada instancia como INSTALADA
        let instancesProcessed = 0;
        
        for (const uniqueId of material.instanceIds) {
           const instance = inventoryItem.instances.find((inst: any) => inst.uniqueId === uniqueId);
           
           if (!instance) {
             throw new Error(`Instancia ${uniqueId} no encontrada en el inventario`);
           }
           
           // IDEMPOTENCY CHECK: If already installed on THIS order, skip
           if (instance.status === 'installed' && instance.installedAt?.orderId?.toString() === orderId) {
             continue; 
           }
           
           // Validar estado (debe estar assigned a la crew, o in-stock si fuera uso directo bodega, pero aqui es desde crew)
           if (instance.status !== 'assigned') {
              throw new Error(`Instancia ${uniqueId} no está disponible en la cuadrilla (estado: ${instance.status})`);
           }
           
           // Verificar que esté asignada a ESTA cuadrilla
           if (instance.assignedTo?.crewId?.toString() !== crewId) {
             throw new Error(`Instancia ${uniqueId} no pertenece a esta cuadrilla`);
           }

           // Actualizar estado
           instance.status = 'installed';
           instance.installedAt = {
             orderId: new mongoose.Types.ObjectId(orderId),
             installedDate: new Date(),
             location: 'installed-via-order-completion', 
           };
           
           instancesProcessed++;
        }
        
        // Only save and deduct if changes were made
        if (instancesProcessed > 0) {
            await inventoryItem.save({ session });
            
            // Descontar del inventario de la cuadrilla (cantidad)
            const itemIndex = crew.assignedInventory.findIndex(
              (inv: any) => inv.item.toString() === material.inventoryId
            );

            if (itemIndex >= 0) {
              crew.assignedInventory[itemIndex].quantity -= instancesProcessed;
              crew.assignedInventory[itemIndex].lastUpdate = new Date();

              if (crew.assignedInventory[itemIndex].quantity <= 0) {
                crew.assignedInventory.splice(itemIndex, 1);
              }
            }
            
            // Historial
             await InventoryHistoryModel.create(
              [
                {
                  item: material.inventoryId,
                  type: "usage_order",
                  quantityChange: -instancesProcessed,
                  reason: `Equipos instalados (${instancesProcessed}): ${material.instanceIds.join(', ')}`,
                  crew: crewId,
                  order: orderId,
                  performedBy: sessionUser?.userId,
                  performedByModel: sessionUser?.userModel,
                  metadata: { instanceIds: material.instanceIds }
                },
              ],
              { session }
            );
        }

      } else {
        // Material regular (no bobina, no equipo con instancias)
        
        // Validar que no sea equipo sin instanceId
        const inventoryItem = await InventoryModel.findById(material.inventoryId).session(session);
        if (inventoryItem && inventoryItem.type === "equipment") {
          throw new Error(
            `El equipo "${inventoryItem.description}" debe especificar qué instancia se utilizó. ` +
            `No se puede consumir por cantidad sin instanceIds.`
          );
        }
        
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
 * Restaura materiales eliminados de una orden al inventario de la cuadrilla
 * @param orderId - ID de la orden
 * @param crewId - ID de la cuadrilla
 * @param materials - Array de materiales a restaurar
 * @param sessionUser - Usuario que realiza la acción
 */
export async function restoreInventoryFromOrder(
  orderId: string,
  crewId: string,
  materials: { inventoryId: string; quantity: number; batchCode?: string; instanceIds?: string[] }[],
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

    for (const material of materials) {
      // 1. Manejo de Bobinas (Batch)
      if (material.batchCode) {
        const batch = await InventoryBatchModel.findOne({
          batchCode: material.batchCode.toUpperCase(),
          crew: crewId,
        }).session(session);

        // Si existe el batch, restaurar cantidad
        if (batch) {
            batch.currentQuantity += material.quantity;
            if (batch.status === 'depleted' && batch.currentQuantity > 0) {
                batch.status = 'active';
            }
            await batch.save({ session });
            
            // IMPORTANT: Also restore to parent inventory item's currentStock
            await InventoryModel.findByIdAndUpdate(
              material.inventoryId,
              { $inc: { currentStock: material.quantity } },
              { session }
            );
            
            // Historial
            await InventoryHistoryModel.create([{
                item: material.inventoryId,
                batch: batch._id,
                type: "return", // Usamos return para indicar que vuelve
                quantityChange: material.quantity,
                reason: `Restaurado desde orden ${orderId} (eliminado)`,
                crew: crewId,
                order: orderId,
                performedBy: sessionUser?.userId,
                performedByModel: sessionUser?.userModel,
            }], { session });

        } else {
             // Si el batch ya no existe (raro), se podría intentar recrear o loguear error
             // Por simplificación, si no existe el batch en la crew, asumimos que fue movido y no podemos restaurar fácilmente 
             // O simplemente lo ignoramos para evitar bloqueos, o lanzamos error.
             // Optamos por log warning y continuar (o lanzar error si es estricto)
             console.warn(`Batch ${material.batchCode} no encontrado en crew ${crewId} para restauración.`);
        }
        
        // Actualizar asignación en la cuadrilla
         const itemIndex = crew.assignedInventory.findIndex(
          (inv: any) => inv.item.toString() === material.inventoryId
        );
        
        if (itemIndex >= 0) {
            crew.assignedInventory[itemIndex].quantity += material.quantity;
            crew.assignedInventory[itemIndex].lastUpdate = new Date();
        } else {
             crew.assignedInventory.push({
                item: new mongoose.Types.ObjectId(material.inventoryId),
                quantity: material.quantity,
                lastUpdate: new Date(),
             });
        }
        
      } 
      // 2. Manejo de Instancias (Equipos)
      else if (material.instanceIds && material.instanceIds.length > 0) {
        console.log(`[RESTORE] Restaurando instancias para inventario ${material.inventoryId}: ${material.instanceIds.join(', ')}`);
        const inventoryItem = await InventoryModel.findById(material.inventoryId).session(session);
        if (inventoryItem) {
            let restoredCount = 0;
            const restoredInstances = [];

            for (const uniqueId of material.instanceIds) {
                const instance = inventoryItem.instances.find((inst: any) => inst.uniqueId === uniqueId);
                
                if (!instance) {
                    console.warn(`[RESTORE] Instancia ${uniqueId} no encontrada en inventario.`);
                    continue;
                }

                console.log(`[RESTORE] Verificando instancia ${uniqueId}: Status=${instance.status}, InstalledAt=${instance.installedAt?.orderId}, AssignedTo=${instance.assignedTo?.crewId}, TargetOrder=${orderId}`);

                // Case 1: Instance was INSTALLED in this order - restore to 'assigned'
                const isInstalledInThisOrder = instance.status === 'installed' && instance.installedAt?.orderId?.toString() === orderId.toString();
                
                // Case 2: Instance is ASSIGNED to this crew (equipment added to order but order not completed yet)
                // In this case, instance is already 'assigned' to crew, so we just need to update the crew inventory count
                const isAssignedToThisCrew = instance.status === 'assigned' && instance.assignedTo?.crewId?.toString() === crewId.toString();
                
                if (isInstalledInThisOrder) {
                    // Restore from installed -> assigned
                    instance.status = 'assigned';
                    instance.assignedTo = {
                        crewId: new mongoose.Types.ObjectId(crewId),
                        assignedAt: new Date(), 
                    };
                    instance.installedAt = undefined;
                    restoredCount++;
                    restoredInstances.push(uniqueId);
                    console.log(`[RESTORE] Instancia ${uniqueId} restaurada de 'installed' a 'assigned'.`);
                } else if (isAssignedToThisCrew) {
                    // Instance is already assigned to crew, we just need to restore the crew inventory count
                    // No change to instance status needed, but we increment the count
                    restoredCount++;
                    restoredInstances.push(uniqueId);
                    console.log(`[RESTORE] Instancia ${uniqueId} ya está 'assigned' a la cuadrilla, restaurando conteo.`);
                } else {
                    console.warn(`[RESTORE] Instancia ${uniqueId} saltada. Status=${instance.status}, no cumple condiciones.`);
                }
            }
            
            if (restoredCount > 0) {
                await inventoryItem.save({ session });
                console.log(`[RESTORE] Guardado inventoryItem con ${restoredCount} instancias restauradas.`);
                
                // Actualizar cuadrilla
                const itemIndex = crew.assignedInventory.findIndex(
                  (inv: any) => inv.item.toString() === material.inventoryId
                );
                
                if (itemIndex >= 0) {
                    crew.assignedInventory[itemIndex].quantity += restoredCount;
                    crew.assignedInventory[itemIndex].lastUpdate = new Date();
                    console.log(`[RESTORE] Incrementada cantidad en crew (index ${itemIndex}) en ${restoredCount}.`);
                } else {
                     crew.assignedInventory.push({
                        item: new mongoose.Types.ObjectId(material.inventoryId),
                        quantity: restoredCount,
                        lastUpdate: new Date(),
                     });
                     console.log(`[RESTORE] Agregado nuevo item a crew con cantidad ${restoredCount}.`);
                }

                // Historial
                await InventoryHistoryModel.create([{
                    item: material.inventoryId,
                    type: "return",
                    quantityChange: restoredCount,
                    reason: `Equipos restaurados desde orden ${orderId}: ${restoredInstances.join(', ')}`,
                    crew: crewId,
                    order: orderId,
                    performedBy: sessionUser?.userId,
                    performedByModel: sessionUser?.userModel,
                    metadata: { instanceIds: restoredInstances }
                }], { session });
            }
        }
      } 
      // 3. Material Genérico
      else {
          // Solo restaurar si la orden estaba completada y se había descontado
          // Pero... esta función se llama cuando detectamos remoción.
          // Si la orden NO estaba completada, los materiales genéricos NO se descontaron, por lo tanto NO hay que restaurarlos.
          // ESTA LOGICA DEBE SER CONTROLADA POR EL LLAMADOR (Route Handler).
          // El Route Handler solo debe llamar a restoreInventoryFromOrder con materials genéricos SI la orden estaba completada.
          // Aquí asumimos que si nos llega, es porque hay que restaurarlo.
          
          const inventoryItem = await InventoryModel.findById(material.inventoryId).session(session); // Solo para validar que existe
          
          if (inventoryItem) { // Si existe
             const itemIndex = crew.assignedInventory.findIndex(
              (inv: any) => inv.item.toString() === material.inventoryId
            );
            
            if (itemIndex >= 0) {
                crew.assignedInventory[itemIndex].quantity += material.quantity;
                crew.assignedInventory[itemIndex].lastUpdate = new Date();
            } else {
                 crew.assignedInventory.push({
                    item: new mongoose.Types.ObjectId(material.inventoryId),
                    quantity: material.quantity,
                    lastUpdate: new Date(),
                 });
            }
            
            // Historial
            await InventoryHistoryModel.create([{
                item: material.inventoryId,
                type: "return",
                quantityChange: material.quantity,
                reason: `Material restaurado desde orden ${orderId}`,
                crew: crewId,
                order: orderId,
                performedBy: sessionUser?.userId,
                performedByModel: sessionUser?.userModel,
            }], { session });
          }
      }
    }

    crew.markModified('assignedInventory');
    await crew.save({ session });
    await session.commitTransaction();

    return { success: true };
  } catch (error) {
    console.error("[RESTORE] Transaction error:", error);
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
      .filter((m: any) => m.type === "usage_order" && m.item && m.item._id) // Add null check
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
// EQUIPMENT INSTANCE MANAGEMENT FUNCTIONS
// ============================================================================

import type { CreateInstanceInput, AssignInstanceInput, InstallInstanceInput } from "@/types/inventory";

/**
 * Añade instancias a un ítem de equipo
 * @param inventoryId - ID del ítem de inventario
 * @param instances - Array de instancias a añadir
 * @param sessionUser - Usuario que realiza la acción
 * @returns Ítem actualizado
 */
export async function addEquipmentInstances(
  inventoryId: string,
  instances: CreateInstanceInput[],
  sessionUser?: SessionUser
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const item = await InventoryModel.findById(inventoryId).session(session);

    if (!item) {
      throw new Error(`Ítem de inventario no encontrado: ${inventoryId}`);
    }

    if (item.type !== "equipment") {
      throw new Error(
        `Solo se pueden añadir instancias a ítems de tipo 'equipment'. Este ítem es de tipo '${item.type}'`
      );
    }

    // Validar que los uniqueIds no existan ya
    const existingIds = new Set(item.instances?.map((inst: any) => inst.uniqueId) || []);
    for (const instance of instances) {
      if (existingIds.has(instance.uniqueId)) {
        throw new Error(`El ID único '${instance.uniqueId}' ya existe en este equipo`);
      }
    }

    // Añadir las nuevas instancias
    const newInstances = instances.map((inst) => ({
      uniqueId: inst.uniqueId,
      serialNumber: inst.serialNumber,
      macAddress: inst.macAddress,
      notes: inst.notes,
      status: "in-stock",
      createdAt: new Date(),
    }));

    if (!item.instances) {
      item.instances = [];
    }
    item.instances.push(...newInstances);

    await item.save({ session });

    // Crear registro en historial
    await InventoryHistoryModel.create(
      [
        {
          item: inventoryId,
          type: "entry",
          quantityChange: instances.length,
          reason: `Añadidas ${instances.length} instancias de equipo: ${instances.map((i) => i.uniqueId).join(", ")}`,
          performedBy: sessionUser?.userId,
          performedByModel: sessionUser?.userModel,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return item;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Obtiene instancias disponibles de un equipo
 * @param inventoryId - ID del ítem de inventario
 * @param status - Filtro de estado (opcional)
 * @returns Array de instancias
 */
export async function getAvailableInstances(
  inventoryId: string,
  status: string = "in-stock"
) {
  await connectDB();

  const item = await InventoryModel.findById(inventoryId).lean() as any;

  if (!item) {
    throw new Error(`Ítem de inventario no encontrado: ${inventoryId}`);
  }

  if (item.type !== "equipment") {
    return [];
  }

  if (!item.instances || item.instances.length === 0) {
    return [];
  }

  return item.instances.filter((inst: any) => inst.status === status);
}

/**
 * Asigna instancias de equipo a una cuadrilla
 * @param inventoryId - ID del ítem de inventario
 * @param instanceIds - IDs únicos de las instancias a asignar
 * @param crewId - ID de la cuadrilla
 * @param sessionUser - Usuario que realiza la asignación
 * @returns Resultado de la asignación
 */
export async function assignEquipmentInstances(
  inventoryId: string,
  instanceIds: string[],
  crewId: string,
  sessionUser?: SessionUser
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const item = await InventoryModel.findById(inventoryId).session(session);
    const crew = await CrewModel.findById(crewId).session(session);

    if (!item) {
      throw new Error(`Ítem de inventario no encontrado: ${inventoryId}`);
    }

    if (!crew) {
      throw new Error(`Cuadrilla no encontrada: ${crewId}`);
    }

    if (item.type !== "equipment") {
      throw new Error("Solo se pueden asignar instancias de equipos");
    }

    // Asignar cada instancia
    for (const uniqueId of instanceIds) {
      const instance = item.instances?.find((inst: any) => inst.uniqueId === uniqueId);

      if (!instance) {
        throw new Error(`Instancia no encontrada: ${uniqueId}`);
      }

      if (instance.status !== "in-stock") {
        throw new Error(
          `La instancia ${uniqueId} no está disponible (estado: ${instance.status})`
        );
      }

      // Actualizar estado de la instancia
      instance.status = "assigned";
      instance.assignedTo = {
        crewId: new mongoose.Types.ObjectId(crewId),
        assignedAt: new Date(),
      };
    }

    await item.save({ session });

    // Añadir a inventario de la cuadrilla (cantidad = número de instancias)
    const existingItemIndex = crew.assignedInventory.findIndex(
      (inv: any) => inv.item.toString() === inventoryId
    );

    if (existingItemIndex >= 0) {
      crew.assignedInventory[existingItemIndex].quantity += instanceIds.length;
      crew.assignedInventory[existingItemIndex].lastUpdate = new Date();
    } else {
      crew.assignedInventory.push({
        item: new mongoose.Types.ObjectId(inventoryId),
        quantity: instanceIds.length,
        lastUpdate: new Date(),
      });
    }

    await crew.save({ session });

    // Crear registro en historial
    await InventoryHistoryModel.create(
      [
        {
          item: inventoryId,
          type: "assignment",
          quantityChange: -instanceIds.length,
          reason: `Instancias asignadas a cuadrilla ${crew.name}: ${instanceIds.join(", ")}`,
          crew: crewId,
          performedBy: sessionUser?.userId,
          performedByModel: sessionUser?.userModel,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      success: true,
      assignedInstances: instanceIds,
      crewId,
      crewName: crew.name,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Marca una instancia como instalada en una orden
 * @param inventoryId - ID del ítem de inventario
 * @param uniqueId - ID único de la instancia
 * @param orderId - ID de la orden
 * @param location - Dirección de instalación
 * @param sessionUser - Usuario que realiza la acción
 * @returns Ítem actualizado
 */
export async function markInstanceAsInstalled(
  inventoryId: string,
  uniqueId: string,
  orderId: string,
  location: string,
  sessionUser?: SessionUser
) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const item = await InventoryModel.findById(inventoryId).session(session);

    if (!item) {
      throw new Error(`Ítem de inventario no encontrado: ${inventoryId}`);
    }

    const instance = item.instances?.find((inst: any) => inst.uniqueId === uniqueId);

    if (!instance) {
      throw new Error(`Instancia no encontrada: ${uniqueId}`);
    }

    if (instance.status !== "assigned") {
      throw new Error(
        `La instancia ${uniqueId} debe estar asignada para ser instalada (estado actual: ${instance.status})`
      );
    }

    // Actualizar estado de la instancia
    instance.status = "installed";
    instance.installedAt = {
      orderId: new mongoose.Types.ObjectId(orderId),
      installedDate: new Date(),
      location,
    };

    await item.save({ session });

    // Crear registro en historial
    await InventoryHistoryModel.create(
      [
        {
          item: inventoryId,
          type: "usage_order",
          quantityChange: -1,
          reason: `Instancia ${uniqueId} instalada en ${location}`,
          order: orderId,
          crew: instance.assignedTo?.crewId,
          performedBy: sessionUser?.userId,
          performedByModel: sessionUser?.userModel,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return item;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Obtiene todas las instancias de un equipo con filtros
 * @param inventoryId - ID del ítem de inventario
 * @param filters - Filtros opcionales (status)
 * @returns Array de instancias
 */
export async function getEquipmentInstances(
  inventoryId: string,
  filters: { status?: string } = {}
) {
  await connectDB();

  const item = await InventoryModel.findById(inventoryId)
    .populate("instances.assignedTo.crewId", "name")
    .lean() as any;

  if (!item) {
    throw new Error(`Ítem de inventario no encontrado: ${inventoryId}`);
  }

  if (item.type !== "equipment") {
    return [];
  }

  let instances = item.instances || [];

  if (filters.status) {
    instances = instances.filter((inst: any) => inst.status === filters.status);
  }

  return instances;
}

/**
 * Actualiza una instancia de equipo
 * @param inventoryId - ID del ítem de inventario
 * @param uniqueId - ID único de la instancia
 * @param updates - Datos a actualizar (serialNumber, macAddress, notes, status)
 * @returns Ítem actualizado
 */
export async function updateEquipmentInstance(
  inventoryId: string,
  uniqueId: string,
  updates: {
    serialNumber?: string;
    macAddress?: string;
    notes?: string;
    status?: string;
  }
) {
  await connectDB();

  const item = await InventoryModel.findById(inventoryId);

  if (!item) {
    throw new Error(`Ítem de inventario no encontrado: ${inventoryId}`);
  }

  const instance = item.instances?.find((inst: any) => inst.uniqueId === uniqueId);

  if (!instance) {
    throw new Error(`Instancia no encontrada: ${uniqueId}`);
  }

  // Actualizar campos permitidos
  if (updates.serialNumber !== undefined) instance.serialNumber = updates.serialNumber;
  if (updates.macAddress !== undefined) instance.macAddress = updates.macAddress;
  if (updates.notes !== undefined) instance.notes = updates.notes;
  
  // Solo permitir cambio de estado si no está instalado
  if (updates.status !== undefined) {
    if (instance.status === "installed") {
      throw new Error("No se puede cambiar el estado de una instancia instalada");
    }
    instance.status = updates.status;
  }

  await item.save();
  return item;
}

/**
 * Elimina una instancia de un equipo (solo si está en stock)
 * @param inventoryId - ID del ítem de inventario
 * @param uniqueId - ID único de la instancia
 * @returns Ítem actualizado
 */
export async function deleteEquipmentInstance(
  inventoryId: string,
  uniqueId: string
) {
  await connectDB();

  const item = await InventoryModel.findById(inventoryId);

  if (!item) {
    throw new Error(`Ítem de inventario no encontrado: ${inventoryId}`);
  }

  const instanceIndex = item.instances?.findIndex(
    (inst: any) => inst.uniqueId === uniqueId
  );

  if (instanceIndex === undefined || instanceIndex < 0) {
    throw new Error(`Instancia no encontrada: ${uniqueId}`);
  }

  const instance = item.instances[instanceIndex];

  if (instance.status !== "in-stock") {
    throw new Error(
      `Solo se pueden eliminar instancias en stock. Estado actual: ${instance.status}`
    );
  }

  item.instances.splice(instanceIndex, 1);
  await item.save();

  return item;
}

// ============================================================================
// BATCH/BOBBIN MANAGEMENT FUNCTIONS
// ============================================================================


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

/**
 * Devuelve instancias de equipos de una cuadrilla al almacén
 * @param crewId - ID de la cuadrilla
 * @param instanceIds - Array de IDs únicos de instancias a devolver
 * @param reason - Motivo de la devolución
 * @param sessionUser - Usuario que realiza la devolución
 */
export async function returnEquipmentInstances(
  crewId: string,
  instanceIds: string[],
  reason: string,
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

    // Group instances by inventory item for efficient processing
    const instancesByItem = new Map<string, string[]>();

    // First pass: validate all instances and group them
    for (const uniqueId of instanceIds) {
      let found = false;

      // Search through all inventory items to find this instance
      const inventoryItems = await InventoryModel.find({ type: "equipment" }).session(session);

      for (const inventoryItem of inventoryItems) {
        const instance = inventoryItem.instances.find(
          (inst: any) => inst.uniqueId === uniqueId
        );

        if (instance) {
          // Validate instance is assigned to this crew
          if (instance.status !== 'assigned') {
            throw new Error(
              `La instancia ${uniqueId} no está asignada (estado: ${instance.status})`
            );
          }

          if (instance.assignedTo?.crewId?.toString() !== crewId) {
            throw new Error(
              `La instancia ${uniqueId} no está asignada a esta cuadrilla`
            );
          }

          // Group by inventory item
          if (!instancesByItem.has(inventoryItem._id.toString())) {
            instancesByItem.set(inventoryItem._id.toString(), []);
          }
          instancesByItem.get(inventoryItem._id.toString())!.push(uniqueId);

          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error(`Instancia ${uniqueId} no encontrada`);
      }
    }

    // Second pass: update instances and inventory
    for (const [inventoryId, itemInstanceIds] of Array.from(instancesByItem.entries())) {
      const inventoryItem = await InventoryModel.findById(inventoryId).session(session);

      if (!inventoryItem) continue;

      // Update each instance
      for (const uniqueId of itemInstanceIds) {
        const instance = inventoryItem.instances.find(
          (inst: any) => inst.uniqueId === uniqueId
        );

        if (instance) {
          instance.status = 'in-stock';
          instance.assignedTo = undefined;
        }
      }

      // Save inventory item with updated instances
      await inventoryItem.save({ session });

      // Update crew's assigned inventory
      const crewInventoryIndex = crew.assignedInventory.findIndex(
        (inv: any) => inv.item.toString() === inventoryId
      );

      if (crewInventoryIndex >= 0) {
        crew.assignedInventory[crewInventoryIndex].quantity -= itemInstanceIds.length;

        // Remove from crew if quantity reaches 0
        if (crew.assignedInventory[crewInventoryIndex].quantity <= 0) {
          crew.assignedInventory.splice(crewInventoryIndex, 1);
        } else {
          crew.assignedInventory[crewInventoryIndex].lastUpdate = new Date();
        }
      }

      // Create history record
      await InventoryHistoryModel.create(
        [
          {
            item: inventoryId,
            type: "return",
            quantityChange: itemInstanceIds.length,
            reason: `${itemInstanceIds.length} instancia(s) devuelta(s) por ${crew.name}: ${reason}`,
            crew: crewId,
            performedBy: sessionUser?.userId,
            performedByModel: sessionUser?.userModel,
            metadata: {
              instanceIds: itemInstanceIds,
            },
          },
        ],
        { session }
      );
    }

    // Save crew with updated inventory
    await crew.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      returnedCount: instanceIds.length,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

