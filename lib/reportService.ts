// lib/reportService.ts
// Servicio central para generación de reportes con agregaciones MongoDB

import { connectDB } from "@/lib/db";
import OrderModel from "@/models/Order";
import CrewModel from "@/models/Crew";
import InventoryModel from "@/models/Inventory";
import InventoryHistoryModel from "@/models/InventoryHistory";
import InventorySnapshotModel from "@/models/InventorySnapshot";
import InventoryBatchModel from "@/models/InventoryBatch";
import mongoose from "mongoose";
import { SessionUser } from "@/lib/authHelpers";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import type { Types } from "mongoose";
import type {
  DailyReportData,
  CrewDailyData,
  MonthlyReportData,
  InventoryReportData,
  NetunoReportData,
  CrewPerformanceData,
  CrewInventoryData,
  CrewVisitsData,
  OrderSummary,
} from "@/types/reportTypes";

// Type for lean Crew document
interface CrewDocument {
  _id: Types.ObjectId;
  number: number;
  leader: Types.ObjectId;
  members: Types.ObjectId[];
  vehiclesAssigned?: Array<{ id: string; name: string }>;
  isActive: boolean;
  assignedInventory?: Array<{
    item: {
      _id: Types.ObjectId;
      code: string;
      description: string;
      unit: string;
    };
    quantity: number;
    lastUpdated?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper function to transform raw Mongoose documents into OrderSummary objects
 */
function transformToOrderSummary(order: any): OrderSummary {
  return {
    _id: order._id.toString(),
    subscriberNumber: order.subscriberNumber,
    subscriberName: order.subscriberName,
    address: order.address,
    ticket: order.ticket_id || "", // Map ticket_id from model to ticket
    type: order.type,
    status: order.status,
    completionDate: order.completionDate || order.updatedAt, // Fallback to updatedAt
    assignmentDate: order.assignmentDate || order.createdAt, // Fallback to createdAt
    assignedTo: order.assignedTo ? {
      _id: order.assignedTo._id?.toString() || order.assignedTo.toString(),
      number: order.assignedTo.number || null,
    } : undefined,
    node: order.node,
    servicesToInstall: order.servicesToInstall,
  };
}

/**
 * 1. Reporte diario de instalaciones/averías agrupado por cuadrilla
 * Siempre usa la fecha actual y agrupa por cuadrilla
 */
export async function getDailyReport(
  type: "instalacion" | "averia" | "all" = "all",
  sessionUser?: SessionUser
): Promise<DailyReportData> {
  await connectDB();

  // Usar fecha actual
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const baseFilter: any = {
    $or: [
      {
        completionDate: { $gte: startOfDay, $lte: endOfDay },
        status: "completed",
      },
      {
        assignmentDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ["assigned", "in_progress"] },
      },
    ],
  };

  if (type !== "all") {
    baseFilter.type = type;
  }

  // Buscar todas las órdenes del día y poblar cuadrilla
  const orders = await OrderModel.find(baseFilter)
    .populate("assignedTo", "number")
    .lean();

  // Agrupar por cuadrilla
  const crewMap = new Map<string, CrewDailyData>();

  for (const order of orders) {
    const crew = order.assignedTo as any;
    if (!crew) continue; // Skip órdenes sin cuadrilla

    const crewId = crew._id.toString();

    if (!crewMap.has(crewId)) {
      crewMap.set(crewId, {
        crewId,
        crewNumber: crew.number || 0,
        crewName: `Cuadrilla ${crew.number || "S/N"}`,
        completadas: [],
        noCompletadas: [],
        totales: {
          completadas: 0,
          noCompletadas: 0,
        },
      });
    }

    const crewData = crewMap.get(crewId)!;
    const orderSummary = transformToOrderSummary(order);

    if (order.status === "completed") {
      crewData.completadas.push(orderSummary);
      crewData.totales.completadas++;
    } else {
      crewData.noCompletadas.push(orderSummary);
      crewData.totales.noCompletadas++;
    }
  }

  // Convertir Map a array y ordenar por número de cuadrilla
  const cuadrillas = Array.from(crewMap.values()).sort(
    (a, b) => a.crewNumber - b.crewNumber
  );

  // Calcular totales generales
  const totales = cuadrillas.reduce(
    (acc, crew) => ({
      completadas: acc.completadas + crew.totales.completadas,
      noCompletadas: acc.noCompletadas + crew.totales.noCompletadas,
    }),
    { completadas: 0, noCompletadas: 0 }
  );

  return {
    fecha: format(today, "yyyy-MM-dd"),
    cuadrillas,
    totales,
  };
}

/**
 * 2. Reporte mensual agregado
 * Genera reporte para todo el mes especificado con breakdown diario
 */
export async function getMonthlyReport(
  dateRange: { start: string; end: string },
  type: "instalacion" | "averia" | "recuperacion" | "all" = "all",
  sessionUser?: SessionUser
): Promise<DailyReportData> { // Reuse DailyReportData as structure is identical
  await connectDB();

  const startDate = parseISO(dateRange.start);
  const endDate = parseISO(dateRange.end);

  // Set end of day for the last day of month
  endDate.setHours(23, 59, 59, 999);

  console.log(`[DEBUG] getMonthlyReport Params: Range=${dateRange.start} to ${dateRange.end}, Type=${type}`);
  console.log(`[DEBUG] Date Range: ${startDate.toISOString()} -> ${endDate.toISOString()}`);

  // DIAGNOSTICO 1: Buscar CUALQUIER orden en este rango de fechas (sin importar status ni type)
  const broadQuery = {
    $or: [
      { completionDate: { $gte: startDate, $lte: endDate } },
      { assignmentDate: { $gte: startDate, $lte: endDate } }
    ]
  };
  const broadCount = await OrderModel.countDocuments(broadQuery);
  console.log(`[DEBUG LEVEL 1] Total orders in date range (any status/type): ${broadCount}`);

  if (broadCount > 0) {
    // Ver qué tipos y status existen en este rango
    const typesFound = await OrderModel.distinct('type', broadQuery);
    const statusesFound = await OrderModel.distinct('status', broadQuery);
    console.log(`[DEBUG LEVEL 1] Types found in range:`, typesFound);
    console.log(`[DEBUG LEVEL 1] Statuses found in range:`, statusesFound);
  }

  const baseFilter: any = {
    $or: [
      {
        completionDate: { $gte: startDate, $lte: endDate },
        status: "completed",
      },
      {
        assignmentDate: { $gte: startDate, $lte: endDate },
        status: { $in: ["assigned", "in_progress"] },
      },
    ],
  };

  const statusCount = await OrderModel.countDocuments(baseFilter);
  console.log(`[DEBUG LEVEL 2] Orders matching Date + Status requirement: ${statusCount}`);

  if (type !== "all") {
    baseFilter.type = type;
  }

  console.log(`[DEBUG LEVEL 3] Final Query with Type filter (${type}):`, JSON.stringify(baseFilter, null, 2));

  // Buscar todas las órdenes del mes y poblar cuadrilla
  const orders = await OrderModel.find(baseFilter)
    .populate("assignedTo", "number")
    .lean();

  console.log(`[DEBUG FINAL] Orders returned: ${orders.length}`);

  // Agrupar por cuadrilla
  const crewMap = new Map<string, CrewDailyData>();

  for (const order of orders) {
    const crew = order.assignedTo as any;
    if (!crew) continue; // Skip órdenes sin cuadrilla

    const crewId = crew._id.toString();

    if (!crewMap.has(crewId)) {
      crewMap.set(crewId, {
        crewId,
        crewNumber: crew.number || 0,
        crewName: `Cuadrilla ${crew.number || "S/N"}`,
        completadas: [],
        noCompletadas: [],
        totales: {
          completadas: 0,
          noCompletadas: 0,
        },
      });
    }

    const crewData = crewMap.get(crewId)!;
    const orderSummary = transformToOrderSummary(order);

    if (order.status === "completed") {
      crewData.completadas.push(orderSummary);
      crewData.totales.completadas++;
    } else {
      crewData.noCompletadas.push(orderSummary);
      crewData.totales.noCompletadas++;
    }
  }

  // Convertir Map a array y ordenar por número de cuadrilla
  const cuadrillas = Array.from(crewMap.values()).sort(
    (a, b) => a.crewNumber - b.crewNumber
  );

  // Calcular totales generales
  const totales = cuadrillas.reduce(
    (acc, crew) => ({
      completadas: acc.completadas + crew.totales.completadas,
      noCompletadas: acc.noCompletadas + crew.totales.noCompletadas,
    }),
    { completadas: 0, noCompletadas: 0 }
  );

  return {
    fecha: format(startDate, "yyyy-MM"),
    cuadrillas,
    totales,
  };
}

/**
 * 3. Reporte de movimiento de inventario de bodega
 * Entradas desde Netuno, salidas a cuadrillas, y devoluciones
 */
export async function getInventoryReport(
  dateRange: { start: string; end: string },
  sessionUser?: SessionUser
): Promise<any> {

  await connectDB();

  const startDate = parseISO(dateRange.start);
  const endDate = parseISO(dateRange.end);
  endDate.setHours(23, 59, 59, 999);

  // 1. Entradas desde Netuno (type: "entry")
  const entradasNetuno = await InventoryHistoryModel.aggregate([
    {
      $match: {
        type: "entry",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "inventories",
        localField: "item",
        foreignField: "_id",
        as: "itemInfo",
      },
    },
    { $unwind: "$itemInfo" },
    {
      $project: {
        _id: 1,
        itemCode: "$itemInfo.code",
        itemDescription: "$itemInfo.description",
        quantity: "$quantityChange",
        date: "$createdAt",
        reason: 1,
      },
    },
    { $sort: { date: -1 } },
  ]);

  // 2. Salidas a cuadrillas (type: "assignment")
  const salidasCuadrillas = await InventoryHistoryModel.aggregate([
    {
      $match: {
        type: "assignment",
        createdAt: { $gte: startDate, $lte: endDate },
        crew: { $exists: true, $ne: null },
      },
    },
    {
      $lookup: {
        from: "inventories",
        localField: "item",
        foreignField: "_id",
        as: "itemInfo",
      },
    },
    { $unwind: "$itemInfo" },
    {
      $lookup: {
        from: "crews",
        localField: "crew",
        foreignField: "_id",
        as: "crewInfo",
      },
    },
    { $unwind: { path: "$crewInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        itemCode: "$itemInfo.code",
        itemDescription: "$itemInfo.description",
        quantity: { $abs: "$quantityChange" },
        date: "$createdAt",
        crewNumber: "$crewInfo.number",
        crewName: {
          $concat: ["Cuadrilla ", { $toString: "$crewInfo.number" }]
        },
        reason: 1,
      },
    },
    { $sort: { date: -1 } },
  ]);

  // 3. Devoluciones al inventario (type: "return")
  const devolucionesInventario = await InventoryHistoryModel.aggregate([
    {
      $match: {
        type: "return",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "inventories",
        localField: "item",
        foreignField: "_id",
        as: "itemInfo",
      },
    },
    { $unwind: "$itemInfo" },
    {
      $lookup: {
        from: "crews",
        localField: "crew",
        foreignField: "_id",
        as: "crewInfo",
      },
    },
    { $unwind: { path: "$crewInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        itemCode: "$itemInfo.code",
        itemDescription: "$itemInfo.description",
        quantity: "$quantityChange",
        date: "$createdAt",
        crewNumber: "$crewInfo.number",
        crewName: {
          $cond: {
            if: { $ifNull: ["$crewInfo.number", false] },
            then: { $concat: ["Cuadrilla ", { $toString: "$crewInfo.number" }] },
            else: "N/A"
          }
        },
        reason: 1,
      },
    },
    { $sort: { date: -1 } },
  ]);

  return {
    entradasNetuno,
    salidasCuadrillas,
    devolucionesInventario,
  };
}

/**
 * 4. Reporte de órdenes hacia Netuno
 * Órdenes pendientes de reportar a Google Forms
 */
export async function getNetunoOrdersReport(
  dateRange: { start: string; end: string },
  sessionUser?: SessionUser,
  crewId?: string
): Promise<NetunoReportData> {
  await connectDB();

  // NO cachear - debe ser siempre actualizado
  const startDate = parseISO(dateRange.start);
  const endDate = parseISO(dateRange.end);
  endDate.setHours(23, 59, 59, 999); // Ensure end of day

  const filter: any = {
    status: "completed",
    sentToNetuno: { $ne: true },
    completionDate: { $gte: startDate, $lte: endDate },
  };

  if (crewId) {
    filter.assignedTo = crewId;
  }

  // Filtramos por órdenes completadas que NO han sido enviadas a Netuno
  const rawPendientes = await OrderModel.find(filter)
    .populate("assignedTo")
    .lean();

  if (rawPendientes.length > 0) {
    console.log("[DEBUG REPORT] First order raw assignedTo:", JSON.stringify(rawPendientes[0].assignedTo, null, 2));
  }

  // Transform to OrderSummary objects
  const pendientes = rawPendientes.map(transformToOrderSummary);

  const totales = {
    instalaciones: pendientes.filter((o) => o.type === "instalacion").length,
    averias: pendientes.filter((o) => o.type === "averia").length,
  };

  return { pendientes, totales };
}

/**
 * 5. Cantidad de órdenes por cuadrilla
 * Rendimiento de cada cuadrilla en un período
 */
/**
 * 6. Reporte de Rendimiento de Cuadrillas (Refactorizado)
 * Retorna:
 * - summary: Métricas agrupadas por cuadrilla.
 * - orders: Lista detallada de órdenes para el análisis.
 */
export async function getCrewPerformanceReport(
  dateRange: { start: string; end: string },
  sessionUser: SessionUser,
  crewId?: string
): Promise<{ summary: any[], orders: any[] }> {
  await connectDB();

  const start = new Date(`${dateRange.start}T00:00:00.000Z`);
  const end = new Date(`${dateRange.end}T23:59:59.999Z`);

  const crewFilter: any = { isActive: true };
  if (crewId) {
    crewFilter._id = crewId;
  }

  const crews = await CrewModel.find(crewFilter).select('number name _id').lean();

  const summaryData = [];
  const allOrdersData = [];

  for (const crew of crews) {
    // 1. Asignadas (Total Assigned in Range)
    const assignedCount = await OrderModel.countDocuments({
      assignedTo: crew._id,
      assignmentDate: { $gte: start, $lte: end }
    });

    // 2. Procesadas Real (Completed, Valid Time)
    const validOrders = await OrderModel.find({
      assignedTo: crew._id,
      assignmentDate: { $gte: start, $lte: end },
      status: 'completed',
      $expr: { $ne: ["$createdAt", "$updatedAt"] }
    }).select('ticket_id subscriberName assignedTo createdAt updatedAt assignmentDate completionDate').lean();

    const validCompletedCount = validOrders.length;

    // 3. Calculate Average Time & Collect Detail Rows
    let totalTimeMs = 0;

    if (validCompletedCount > 0) {
      for (const order of validOrders) {
        const created = new Date(order.createdAt).getTime();
        const updated = new Date(order.updatedAt).getTime();
        const diff = updated - created;

        if (diff > 0) {
          totalTimeMs += diff;

          // Calculate specific duration string for this order
          const hours = diff / (1000 * 60 * 60);
          const days = hours / 24;
          let durationStr = `${hours.toFixed(1)} hrs`;
          if (hours >= 24) durationStr = `${days.toFixed(1)} días`;

          allOrdersData.push({
            crewName: `Cuadrilla ${crew.number}`,
            ticket: order.ticket_id || "N/A",
            subscriber: order.subscriberName || "N/A",
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            duration: durationStr,
            durationMs: diff
          });
        }
      }
    }

    const avgTimeMs = validCompletedCount > 0 ? totalTimeMs / validCompletedCount : 0;
    const avgHours = avgTimeMs / (1000 * 60 * 60);
    const avgDays = avgHours / 24;
    let timeString = "-";
    if (validCompletedCount > 0) {
      if (avgHours < 24) {
        timeString = `${avgHours.toFixed(1)} hrs`;
      } else {
        timeString = `${avgDays.toFixed(1)} días`;
      }
    }

    summaryData.push({
      crewName: `Cuadrilla ${crew.number}`,
      assigned: assignedCount,
      validCompleted: validCompletedCount,
      avgTime: timeString,
      rawAvgTimeMs: avgTimeMs
    });
  }

  // Sort summary by crew number
  summaryData.sort((a, b) => {
    const numA = parseInt(a.crewName.replace('Cuadrilla ', '')) || 0;
    const numB = parseInt(b.crewName.replace('Cuadrilla ', '')) || 0;
    return numA - numB;
  });

  // Sort orders by Crew then by Date
  allOrdersData.sort((a, b) => {
    if (a.crewName === b.crewName) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.crewName.localeCompare(b.crewName);
  });

  return { summary: summaryData, orders: allOrdersData };
}

/**
 * 6. Reporte de Movimientos de Inventario por Cuadrilla (Refactorizado)
 * Muestra historial de asignaciones, devoluciones y gastos
 */
export async function getCrewInventoryReport(
  dateRange: { start: string; end: string },
  sessionUser?: SessionUser,
  crewId?: string
): Promise<any[]> {
  await connectDB();

  const startDate = parseISO(dateRange.start);
  const endDate = parseISO(dateRange.end);
  endDate.setHours(23, 59, 59, 999);

  const filter: any = {
    type: { $in: ["assignment", "return", "usage_order"] },
    createdAt: { $gte: startDate, $lte: endDate },
    // Ensure we only get records related to a crew (usage_order always has crew, assignments too, returns too)
    crew: { $exists: true, $ne: null }
  };

  if (crewId) {
    filter.crew = crewId;
  }

  const movements = await InventoryHistoryModel.find(filter)
    .populate("item", "code description")
    .populate("crew", "number")
    .populate("order", "ticket_id subscriberNumber") // Populate order for usage
    .sort({ createdAt: -1 })
    .lean();

  return movements.map((mov: any) => ({
    _id: mov._id,
    date: mov.createdAt,
    type: mov.type,
    crewName: mov.crew?.number ? `Cuadrilla ${mov.crew.number}` : "Cuadrilla Desconocida",
    itemCode: mov.item?.code || "N/A",
    itemDescription: mov.item?.description || "Item Eliminado",
    quantity: Math.abs(mov.quantityChange),
    orderTicket: mov.order?.ticket_id || mov.order?.subscriberNumber || null,
    reason: mov.reason
  }));
}

/**
 * 7. Reporte de visitas por cuadrilla
 * Suma del visitCount de todas las órdenes agrupadas por cuadrilla
 */
export async function getCrewVisitsReport(
  dateRange: { start: string; end: string },
  sessionUser?: SessionUser
): Promise<CrewVisitsData[]> {
  await connectDB();


  const startDate = parseISO(dateRange.start);
  const endDate = parseISO(dateRange.end);

  // Agregación para sumar visitCount por cuadrilla y contar por tipo de orden
  const visitsData = await OrderModel.aggregate([
    {
      $match: {
        assignedTo: { $exists: true, $ne: null },
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$assignedTo",
        totalVisits: { $sum: { $ifNull: ["$visitCount", 0] } },
        orderCount: { $sum: 1 },
        instalaciones: {
          $sum: { $cond: [{ $eq: ["$type", "instalacion"] }, 1, 0] }
        },
        averias: {
          $sum: { $cond: [{ $eq: ["$type", "averia"] }, 1, 0] }
        },
        recuperaciones: {
          $sum: { $cond: [{ $eq: ["$type", "recuperacion"] }, 1, 0] }
        },
      },
    },
    { $sort: { totalVisits: -1 } },
  ]);

  // Populate crew information
  const populatedData = await CrewModel.populate(visitsData, {
    path: "_id",
    select: "number",
  });

  return populatedData.map((crew) => {
    const otros = crew.orderCount - (crew.instalaciones + crew.averias + crew.recuperaciones);
    return {
      crewId: crew._id._id.toString(),
      crewNumber: crew._id.number,
      crewName: `Cuadrilla ${crew._id.number}`,
      totalVisits: crew.totalVisits,
      orderCount: crew.orderCount,
      instalaciones: crew.instalaciones,
      averias: crew.averias,
      recuperaciones: crew.recuperaciones,
      otros: otros,
    };
  });
}

/**
 * 8. Reporte de Stock Actual de Cuadrillas
 * Muestra el inventario actual con detalles (bobinas, seriales)
 */
/**
 * 8. Reporte de Stock Actual de Cuadrillas con Comparativa Histórica
 * Muestra el inventario actual con detalles y compara con un snapshot histórico
 */
/**
 * 8. Reporte de Stock Actual de Cuadrillas con Comparativa Histórica (Calculada)
 * Muestra el inventario actual y calcula estados históricos usando el historial de movimientos (Reverse Calculation)
 */
export async function getCrewStockReport(
  dateRange?: { start: string; end: string },
  crewId?: string
): Promise<any[]> {
  await connectDB();

  console.log(`[DEBUG REPORT] getCrewStockReport called. Range: ${dateRange?.start} - ${dateRange?.end}, Crew: ${crewId}`);

  const startDate = dateRange ? parseISO(dateRange.start) : startOfMonth(new Date());
  const endDate = dateRange ? parseISO(dateRange.end) : new Date(); // End date for the report range

  // Normalize dates
  startDate.setHours(0, 0, 0, 0);
  const endOfDay = new Date(endDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Current Time for "Now"
  const now = new Date();

  // Fetch Crews
  const crewFilter: any = { isActive: true };
  if (crewId) crewFilter._id = crewId;

  const crews = await CrewModel.find(crewFilter)
    .populate("assignedInventory.item", "code description type unit")
    .select("number name assignedInventory")
    .lean();


  // Fetch History for the relevant period: From Start Date to Now
  // We need ALL history from Start Date until Now to reverse calculate back to StartState.
  // Actually, to get StartState, we need reverse from Now to StartDate.
  // To get EndState, we need reverse from Now to EndDate.
  // So we fetch history where date >= StartDate (optimized).
  // Ideally, we fetch history for the crews involved.

  const historyFilter: any = {
    createdAt: { $gte: startDate }, // Optimization: Only need records back to start date
    crew: { $in: crews.map(c => c._id) }
  };

  const history = await InventoryHistoryModel.find(historyFilter)
    .sort({ createdAt: -1 }) // Newest first
    .lean();

  // Helper to determine Crew Delta for a movement
  // Returns the change to the CREW'S stock
  const getCrewDelta = (record: any) => {
    switch (record.type) {
      case 'assignment':
        // Warehouse -X -> Crew +X. Record is -X. Crew Delta is +X.
        // Formula: -1 * quantityChange
        return -1 * record.quantityChange;
      case 'return':
        // Warehouse +X -> Crew -X. Record is +X. Crew Delta is -X.
        // Formula: -1 * record.quantityChange
        return -1 * record.quantityChange;
      case 'usage_order':
        // Usage is consumption. Record is -X. Crew Delta is -X.
        return record.quantityChange;
      case 'adjustment':
        // Assuming adjustment on Crew context is logged as is.
        // Be careful if adjustment is "Add to Warehouse" (positive) vs "Remove from Crew".
        // Checks needed but for now assuming direct impact sign.
        return record.quantityChange;
      default:
        return 0;
    }
  };

  const reportData = [];

  for (const crew of crews) {
    const inventoryMap = new Map<string, any>();
    const crewIdStr = (crew as any)._id.toString();

    // 1. Initialize with Current Live Inventory
    // This is our Ground Truth at "Now"
    const currentInventory = crew.assignedInventory || [];

    // Map current items
    currentInventory.forEach((inv: any) => {
      if (!inv.item) return;
      inventoryMap.set(inv.item.code, {
        code: inv.item.code,
        description: inv.item.description,
        unit: inv.item.unit,
        currentQty: inv.quantity,
        itemId: inv.item._id,
        // Temps for calculation
        calcStart: inv.quantity,
        calcEnd: inv.quantity
      });
    });

    // 2. Process History to Reverse Calculate
    // We filter history for this crew
    const crewHistory = history.filter((h: any) => h.crew?.toString() === crewIdStr);

    // Identify items in history that might not be in current inventory (e.g. fully consumed)
    // We need to fetch details for them if they are missing from map
    const missingItemIds = new Set<string>();
    crewHistory.forEach((h: any) => {
      // We need item code History has item ID.
      // We might need to populate item in history query or do a lookup.
      // For efficiency, let's assume we can get code later or map it.
      // Wait, Map uses Code. History has ID.
      // We need a way to map ID -> Code.
      // Let's populate history item in the query above? Or just collect IDs and fetch.
      missingItemIds.add(h.item.toString());
    });

    // Remove existing
    currentInventory.forEach((inv: any) => {
      if (inv.item) missingItemIds.delete(inv.item._id.toString());
    });

    // Fetch missing items details
    let missingItemsMap = new Map<string, any>();
    if (missingItemIds.size > 0) {
      const items = await InventoryModel.find({ _id: { $in: Array.from(missingItemIds) } }).lean();
      items.forEach((i: any) => missingItemsMap.set(i._id.toString(), i));
    }

    // Add missing items to main map with 0 current quantity
    missingItemsMap.forEach((item: any) => {
      if (!inventoryMap.has(item.code)) {
        inventoryMap.set(item.code, {
          code: item.code,
          description: item.description,
          unit: item.unit,
          currentQty: 0,
          itemId: item._id,
          calcStart: 0,
          calcEnd: 0
        });
      }
    });

    // 3. Apply Reverse Calculation
    // Iterate history descending (Newest -> Oldest)

    // We want:
    // Q_End (at EndDate).
    // Q_Start (at StartDate).

    // Logic:
    // Start with Q = Q_Current (at Now)
    // Iterate backwards.
    // If record.date > EndDate: This movement happened AFTER EndDate.
    //    To get state AT EndDate, we reverse the movement.
    //    Q_running -= Delta. (e.g. If Delta was +10 (Assigned), before that it was Q-10).
    // If record.date > StartDate: This movement happened AFTER StartDate.
    //    To get state AT StartDate, we reverse the movement.

    for (const record of crewHistory) {
      const recDate = new Date(record.createdAt);
      // Get Item Code
      let itemCode = "";
      // Try to find in inventoryMap by ID (Need to iterate or have ID map. Let's build ID map)
      // Optimization: Build ID->Code map

      const itemIdStr = record.item.toString();
      // Find entry
      let entry: any = null;
      // Fix: Using Array.from to avoid MapIterator iteration error in strict TS
      for (const v of Array.from(inventoryMap.values())) {
        if (v.itemId.toString() === itemIdStr) {
          entry = v;
          break;
        }
      }

      if (!entry) continue; // Should not happen given we added missing

      const delta = getCrewDelta(record);

      // Reverse logic: Before = After - Delta

      // Check if this record affects End State (happened after End Date)
      if (recDate > endOfDay) {
        entry.calcEnd -= delta;
      }

      // Check if this record affects Start State (happened after Start Date)
      if (recDate >= startDate) {
        // Usually "Start Inventory" is beginning of day. Movements on Day 1 happen AFTER start.
        // So yes, reverse them to get to 00:00.
        entry.calcStart -= delta;
      }
    }


    // 4. Finalize Data & Fetch Details (Only for Current Items typically?)
    // Report usually shows details for Current Inventory. Historical details are hard.

    const finalizedItems = [];

    // Fix: Using Array.from
    for (const entry of Array.from(inventoryMap.values())) {
      // Skip valid 0s (never had it, or 0 all along)
      if (entry.currentQty === 0 && entry.calcStart === 0 && entry.calcEnd === 0) continue;

      let details: any[] = [];
      let hasDetails = false;

      // Fetch details only if Current Qty > 0 (Live items)
      if (entry.currentQty > 0) {
        // Re-using logic for bobbins/instances
        // Fetch Bobbins
        const bobbins = await InventoryBatchModel.find({
          item: entry.itemId,
          location: 'crew',
          crew: crewIdStr,
          status: 'active',
          currentQuantity: { $gt: 0 }
        }).select('batchCode currentQuantity').lean();

        if (bobbins.length > 0) {
          details = bobbins.map((b: any) => ({
            type: 'bobbin',
            label: b.batchCode,
            value: b.currentQuantity
          }));
          hasDetails = true;
        } else {
          // Fetch Equipments
          // Fix: Explicitly typing as 'any' to avoid property check errors on lean doc
          const invItem: any = await InventoryModel.findById(entry.itemId).select('instances type').lean();
          if (invItem && invItem.type === 'equipment' && invItem.instances) {
            const crewInstances = invItem.instances.filter((inst: any) =>
              inst.assignedTo?.crewId?.toString() === crewIdStr
            );
            if (crewInstances.length > 0) {
              details = crewInstances.map((inst: any) => ({
                type: 'instance',
                label: 'Serial',
                value: inst.serialNumber || 'S/N'
              }));
              hasDetails = true;
            }
          }
        }
      }

      finalizedItems.push({
        code: entry.code,
        description: entry.description,
        unit: entry.unit,
        startQty: Math.max(0, entry.calcStart), // Safety clamp
        endQty: Math.max(0, entry.calcEnd),
        diff: entry.calcEnd - entry.calcStart,
        details,
        hasDetails,
        itemId: entry.itemId
      });
    }

    reportData.push({
      crewId: crew._id,
      crewName: `Cuadrilla ${crew.number}`,
      inventory: finalizedItems
    });
  }

  return reportData;
}

/**
 * Helper: Marcar órdenes como reportadas a Netuno
 */
export async function markOrdersAsReported(orderIds: string[]): Promise<void> {
  await connectDB();
  await OrderModel.updateMany(
    { _id: { $in: orderIds } },
    { $set: { googleFormReported: true } }
  );
}
