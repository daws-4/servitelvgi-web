// lib/reportService.ts
// Servicio central para generación de reportes con agregaciones MongoDB

import { connectDB } from "@/lib/db";
import OrderModel from "@/models/Order";
import CrewModel from "@/models/Crew";
import InventoryModel from "@/models/Inventory";
import InventoryHistoryModel from "@/models/InventoryHistory";
import InventorySnapshotModel from "@/models/InventorySnapshot";
import InventoryBatchModel from "@/models/InventoryBatch";
import OrderSnapshotModel from "@/models/OrderSnapshot";
import mongoose from "mongoose";
import { SessionUser } from "@/lib/authHelpers";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { COMPLETED_STATUSES } from "@/lib/orderConstants";
import { getStartAndEndOfDay, getStartOfMonthMTG4 } from "@/lib/timezone";
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

  // Usar fecha actual en MTG-4
  const todayForFormat = new Date(Date.now() - (4 * 60 * 60 * 1000));
  const { start: startOfDay, end: endOfDay } = getStartAndEndOfDay();

  const baseFilter: any = {
    $or: [
      {
        completionDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: [...COMPLETED_STATUSES] },
      },
      {
        // Fallback: completed orders without completionDate (old data)
        completionDate: { $exists: false },
        updatedAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: [...COMPLETED_STATUSES] },
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

    if ((COMPLETED_STATUSES as readonly string[]).includes(order.status)) {
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
    fecha: format(todayForFormat, "yyyy-MM-dd"),
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

  const { start: startDate } = getStartAndEndOfDay(dateRange.start);
  const { end: endDate } = getStartAndEndOfDay(dateRange.end);

  // DIAGNOSTICO 1: Buscar CUALQUIER orden en este rango de fechas (sin importar status ni type)
  const broadQuery = {
    $or: [
      { completionDate: { $gte: startDate, $lte: endDate } },
      { assignmentDate: { $gte: startDate, $lte: endDate } }
    ]
  };
  const broadCount = await OrderModel.countDocuments(broadQuery);

  if (broadCount > 0) {
    // Ver qué tipos y status existen en este rango
    const typesFound = await OrderModel.distinct('type', broadQuery);
    const statusesFound = await OrderModel.distinct('status', broadQuery);
  }

  const baseFilter: any = {
    $or: [
      {
        completionDate: { $gte: startDate, $lte: endDate },
        status: { $in: [...COMPLETED_STATUSES] },
      },
      {
        // Fallback: completed orders without completionDate (old data)
        completionDate: { $exists: false },
        updatedAt: { $gte: startDate, $lte: endDate },
        status: { $in: [...COMPLETED_STATUSES] },
      },
      {
        assignmentDate: { $gte: startDate, $lte: endDate },
        status: { $in: ["assigned", "in_progress"] },
      },
    ],
  };

  const statusCount = await OrderModel.countDocuments(baseFilter);

  if (type !== "all") {
    baseFilter.type = type;
  }

  // Buscar todas las órdenes del mes y poblar cuadrilla
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

    if ((COMPLETED_STATUSES as readonly string[]).includes(order.status)) {
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
    fecha: dateRange.start.substring(0, 7),
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

  const { start: startDate } = getStartAndEndOfDay(dateRange.start);
  const { end: endDate } = getStartAndEndOfDay(dateRange.end);

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
  const { start: startDate } = getStartAndEndOfDay(dateRange.start);
  const { end: endDate } = getStartAndEndOfDay(dateRange.end);

  const filter: any = {
    status: { $in: [...COMPLETED_STATUSES] },
    sentToNetuno: { $ne: true },
    $or: [
      { completionDate: { $gte: startDate, $lte: endDate } },
      // Fallback: completed orders without completionDate (old data)
      { completionDate: { $exists: false }, updatedAt: { $gte: startDate, $lte: endDate } },
    ],
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

  const { start, end } = {
    start: getStartAndEndOfDay(dateRange.start).start,
    end: getStartAndEndOfDay(dateRange.end).end
  };

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
      status: { $in: [...COMPLETED_STATUSES] },
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

  const { start: startDate } = getStartAndEndOfDay(dateRange.start);
  const { end: endDate } = getStartAndEndOfDay(dateRange.end);

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


  const { start: startDate } = getStartAndEndOfDay(dateRange.start);
  const { end: endDate } = getStartAndEndOfDay(dateRange.end);

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
 * 8. Reporte de Stock de Cuadrillas usando InventorySnapshot
 * - Inicial: Suma de todas las asignaciones del mes (snapshots tipo assignment)
 * - Final: Inventario live (mes actual) o último snapshot daily (mes pasado)
 * - Diferencia: Inicial - Final (clamped a 0 si negativo)
 * - dailySnapshots: Datos diarios para exportación detallada
 */
export async function getCrewStockReport(
  dateRange?: { start: string; end: string },
  crewId?: string
): Promise<any> {
  const result = await _getCrewStockReport(dateRange, crewId);
  return result;
}

// Rename the existing function to _getCrewStockReport to allow the facade above
async function _getCrewStockReport(
  dateRange?: { start: string; end: string },
  crewId?: string
): Promise<any> {
  await connectDB();

  const startDate = dateRange ? parseISO(dateRange.start) : startOfMonth(new Date());
  const endDate = dateRange ? parseISO(dateRange.end) : new Date();

  // Normalize dates
  startDate.setHours(0, 0, 0, 0);
  const endOfDayDate = new Date(endDate);
  endOfDayDate.setHours(23, 59, 59, 999);

  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === endDate.getFullYear() &&
    now.getMonth() === endDate.getMonth();

  // Fetch Crews
  const crewFilter: any = { isActive: true };
  if (crewId) crewFilter._id = crewId;

  const crews = await CrewModel.find(crewFilter)
    .populate("assignedInventory.item", "code description type unit")
    .select("number name assignedInventory")
    .sort({ number: 1 })
    .lean();

  const crewIds = crews.map((c: any) => c._id);

  // ─── 1. Obtener "Inicial": Suma de asignaciones del mes desde InventoryHistory ───
  // InventoryHistory con type='assignment' registra cada asignación a cuadrillas.
  // quantityChange es negativo (se resta de bodega), lo negamos para obtener la cantidad asignada.
  const assignmentHistory = await InventoryHistoryModel.find({
    type: 'assignment',
    crew: { $in: crewIds },
    createdAt: { $gte: startDate, $lte: endOfDayDate },
  })
    .populate('item', 'code description')
    .lean();

  // Construir mapa: crewId -> code -> { total assigned qty, code, description }
  const assignmentMap = new Map<string, Map<string, { qty: number; code: string; description: string }>>();

  for (const record of assignmentHistory) {
    if (!record.crew || !record.item) continue;
    const cId = record.crew.toString();
    const itemData = record.item as any; // populated

    if (!itemData?.code) continue;

    if (!assignmentMap.has(cId)) {
      assignmentMap.set(cId, new Map());
    }
    const itemMap = assignmentMap.get(cId)!;

    // quantityChange is negative for assignments (deducted from warehouse)
    // We negate it to get the positive quantity assigned to the crew
    const assignedQty = Math.abs(record.quantityChange);

    const existing = itemMap.get(itemData.code);
    if (existing) {
      existing.qty += assignedQty;
    } else {
      itemMap.set(itemData.code, {
        qty: assignedQty,
        code: itemData.code,
        description: itemData.description,
      });
    }
  }

  // ─── 2. Obtener "Final" ───
  // Si es mes actual → inventario live de la cuadrilla
  // Si es mes pasado → último snapshot daily del mes
  let lastDailySnapshot: any = null;
  if (!isCurrentMonth) {
    lastDailySnapshot = await InventorySnapshotModel.findOne({
      snapshotType: { $ne: 'assignment' },
      snapshotDate: { $lte: endOfDayDate, $gte: startDate },
    })
      .sort({ snapshotDate: -1 })
      .lean();
  }

  // ─── 3. Obtener snapshots diarios del rango para exportación detallada ───
  const dailySnapshots = await InventorySnapshotModel.find({
    snapshotType: { $ne: 'assignment' },
    snapshotDate: { $gte: startDate, $lte: endOfDayDate },
  })
    .sort({ snapshotDate: 1 })
    .lean();

  // ─── 4. Construir datos del reporte por cuadrilla ───
  const reportData = [];

  for (const crew of crews) {
    const crewIdStr = (crew as any)._id.toString();
    const inventoryMap = new Map<string, any>();

    // --- Final: inventario actual o último snapshot ---
    if (isCurrentMonth) {
      // Usar inventario live
      const currentInventory = crew.assignedInventory || [];
      currentInventory.forEach((inv: any) => {
        if (!inv.item) return;
        inventoryMap.set(inv.item.code, {
          code: inv.item.code,
          description: inv.item.description,
          unit: inv.item.unit,
          endQty: inv.quantity,
          itemId: inv.item._id,
        });
      });
    } else if (lastDailySnapshot) {
      // Usar último snapshot daily del mes
      const crewSnap = lastDailySnapshot.crewInventories.find(
        (cs: any) => cs.crew.toString() === crewIdStr
      );
      if (crewSnap) {
        for (const item of crewSnap.items) {
          inventoryMap.set(item.code, {
            code: item.code,
            description: item.description,
            unit: "",
            endQty: item.quantity,
            itemId: item.item,
          });
        }
      }
    }

    // --- Inicial: asignaciones del mes ---
    const crewAssignments = assignmentMap.get(crewIdStr);

    // Merge assignment items into inventory map
    if (crewAssignments) {
      for (const [code, assignData] of Array.from(crewAssignments.entries())) {
        if (inventoryMap.has(code)) {
          inventoryMap.get(code).startQty = assignData.qty;
        } else {
          inventoryMap.set(code, {
            code: assignData.code,
            description: assignData.description,
            unit: "",
            endQty: 0,
            startQty: assignData.qty,
            itemId: null,
          });
        }
      }
    }

    // --- Calcular Diferencia y obtener detalles ---
    const finalizedItems = [];

    for (const entry of Array.from(inventoryMap.values())) {
      const startQty = entry.startQty ?? 0;
      const endQty = entry.endQty ?? 0;
      const diff = startQty - endQty;

      // Skip items with all zeros
      if (startQty === 0 && endQty === 0) continue;

      // Clamp negatives to 0
      const displayStart = Math.max(0, startQty);
      const displayEnd = Math.max(0, endQty);
      const displayDiff = Math.max(0, displayStart) - Math.max(0, displayEnd);

      let details: any[] = [];
      let hasDetails = false;

      // Fetch details only for live items (current month with qty > 0)
      if (isCurrentMonth && endQty > 0 && entry.itemId) {
        // Fetch Bobbins
        const bobbins = await InventoryBatchModel.find({
          item: entry.itemId,
          location: "crew",
          crew: crewIdStr,
          status: "active",
          currentQuantity: { $gt: 0 },
        })
          .select("batchCode currentQuantity")
          .lean();

        if (bobbins.length > 0) {
          details = bobbins.map((b: any) => ({
            type: "bobbin",
            label: b.batchCode,
            value: b.currentQuantity,
          }));
          hasDetails = true;
        } else {
          const invItem: any = await InventoryModel.findById(entry.itemId)
            .select("instances type")
            .lean();
          if (invItem && invItem.type === "equipment" && invItem.instances) {
            const crewInstances = invItem.instances.filter(
              (inst: any) => inst.assignedTo?.crewId?.toString() === crewIdStr
            );
            if (crewInstances.length > 0) {
              details = crewInstances.map((inst: any) => ({
                type: "instance",
                label: "Serial",
                value: inst.uniqueId || 'S/N',
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
        startQty: displayStart,
        endQty: displayEnd,
        diff: displayDiff,
        details,
        hasDetails,
        itemId: entry.itemId,
      });
    }

    reportData.push({
      crewId: crew._id,
      crewName: `Cuadrilla ${crew.number}`,
      inventory: finalizedItems,
    });
  }

  // ─── 5. Preparar datos diarios para exportación ───
  const dailyData: any[] = [];
  for (const snap of dailySnapshots) {
    const snapDate = format(new Date(snap.snapshotDate), "dd/MM/yyyy");
    for (const crewSnap of snap.crewInventories) {
      const cId = crewSnap.crew.toString();
      if (crewId && cId !== crewId) continue;

      for (const item of crewSnap.items) {
        dailyData.push({
          date: snapDate,
          crewNumber: crewSnap.crewNumber,
          crewName: `Cuadrilla ${crewSnap.crewNumber}`,
          code: item.code,
          description: item.description,
          quantity: item.quantity,
        });
      }
    }
  }

  return {
    crews: reportData,
    dailySnapshots: dailyData,
  };
}

/**
 * 10. Balance General de Inventario (NUEVO)
 * Muestra por cada item: entradas, salidas (asignaciones a cuadrillas),
 * devoluciones, ajustes, gasto directo en órdenes y el stock actual en bodega.
 */
export async function getInventoryBalanceReport(
  dateRange: { start: string; end: string },
  sessionUser?: SessionUser
): Promise<any[]> {
  await connectDB();

  const { start: startDate } = getStartAndEndOfDay(dateRange.start);
  const { end: endDate } = getStartAndEndOfDay(dateRange.end);

  // 1. Obtener todos los items de inventario (Stock actual en bodega)
  const allItems = await InventoryModel.find().lean();
  
  // 2. Obtener la suma agrupada por tipo de movimiento e item
  const movements = await InventoryHistoryModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          item: "$item",
          type: "$type",
        },
        totalQty: { $sum: "$quantityChange" } // Consider raw value. For assignments & usage it's negative.
      }
    }
  ]);

  // 3. Crear un mapa para asociar cálculos por item
  const itemStatsMap = new Map<string, any>();

  allItems.forEach((itm: any) => {
    itemStatsMap.set(itm._id.toString(), {
      id: itm._id.toString(),
      code: itm.code,
      description: itm.description,
      type: itm.type || "N/A",
      unit: itm.unit || "uds",
      entradas: 0,
      salidasCuadrillas: 0, // Las assignment serán negativas, las guardamos como absolutas
      devoluciones: 0,
      ajustes: 0,
      gastoEnOrdenes: 0,
      stockActualBodega: itm.currentStock || 0
    });
  });

  // 4. Poblar mapa con agregaciones
  movements.forEach((mov: any) => {
    const itemId = mov._id.item?.toString();
    if (!itemId || !itemStatsMap.has(itemId)) return;

    const stats = itemStatsMap.get(itemId);
    const type = mov._id.type;
    const qty = mov.totalQty;

    switch (type) {
      case "entry":
        stats.entradas += qty;
        break;
      case "assignment":
        stats.salidasCuadrillas += Math.abs(qty); // Es negativo en DB, sumamos valor absoluto
        break;
      case "return":
        stats.devoluciones += qty; // Deberia ser positivo
        break;
      case "adjustment":
        stats.ajustes += qty; // Puede ser positivo o negativo
        break;
      case "usage_order":
        stats.gastoEnOrdenes += Math.abs(qty); // Es negativo
        break;
      // item_created, item_deleted are ignored for counting quantities
    }
  });

  // 5. Transformar a array y ordenar
  const reportArray = Array.from(itemStatsMap.values()).sort((a, b) => {
    // Ordenar principalmente por tipo material > equipo > herramienta
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.code.localeCompare(b.code);
  });

  // Optional: Filter out items with no movements inside the period AND 0 stock?
  // Depending on preference. Let's return all, or just items with activity/stock.
  const activeItems = reportArray.filter(i => 
    i.entradas > 0 || i.salidasCuadrillas > 0 || i.devoluciones > 0 || 
    i.ajustes !== 0 || i.gastoEnOrdenes > 0 || i.stockActualBodega > 0
  );

  return activeItems;
}

/**
 * 11. Balance de Inventario por Cuadrilla (NUEVO)
 * Muestra por cada cuadrilla, y por cada item: 
 * cantidad asignada, devuelta, gastada en órdenes y cantidad actualmente en mano.
 */
export async function getCrewInventoryBalanceReport(
  dateRange: { start: string; end: string },
  sessionUser?: SessionUser,
  crewId?: string
): Promise<any[]> {
  await connectDB();

  const { start: startDate } = getStartAndEndOfDay(dateRange.start);
  const { end: endDate } = getStartAndEndOfDay(dateRange.end);

  // Filtro base: sólo cuadrillas activas
  const crewFilter: any = { isActive: true };
  if (crewId) crewFilter._id = crewId;

  // 1. Obtener Cuadrillas con su inventario asignado en populate
  const crews = await CrewModel.find(crewFilter)
    .populate("assignedInventory.item", "code description type unit")
    .select("number name isActive assignedInventory")
    .lean();

  const activeCrewsMap = new Map<string, any>();
  crews.forEach((c: any) => {
    activeCrewsMap.set(c._id.toString(), {
      crewId: c._id.toString(),
      crewNumber: c.number,
      crewName: `Cuadrilla ${c.number}`,
      items: new Map<string, any>() // map de itemId -> stats
    });
  });

  const crewIds = Array.from(activeCrewsMap.keys());

  // 2. Obtener la suma agrupada por tipo de movimiento, crew e item
  const movements = await InventoryHistoryModel.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        crew: { $in: crewIds.map(id => new mongoose.Types.ObjectId(id)) }
      },
    },
    {
      $group: {
        _id: {
          crew: "$crew",
          item: "$item",
          type: "$type",
        },
        totalQty: { $sum: "$quantityChange" }
      }
    }
  ]);

  // 3. Obtener info de todos los items que tuvieron movimiento
  const usedItemIds = Array.from(new Set(movements.map((m: any) => m._id.item?.toString()).filter(Boolean)));
  const itemsInfoMatch = await InventoryModel.find({ _id: { $in: usedItemIds } }).select('code description type unit').lean();
  
  const itemsInfoMap = new Map<string, any>();
  itemsInfoMatch.forEach((itm: any) => {
    itemsInfoMap.set(itm._id.toString(), {
      code: itm.code,
      description: itm.description,
      type: itm.type,
      unit: itm.unit
    });
  });

  // 4. Popular datos de movimiento en los mapas de cuadrilla -> item
  movements.forEach((mov: any) => {
    const cId = mov._id.crew?.toString();
    const itemId = mov._id.item?.toString();
    
    if (!cId || !itemId || !activeCrewsMap.has(cId)) return;

    const crewData = activeCrewsMap.get(cId);
    
    if (!crewData.items.has(itemId)) {
      const info = itemsInfoMap.get(itemId) || { code: "N/A", description: "Desc. N/A" };
      crewData.items.set(itemId, {
        itemId: itemId,
        code: info.code,
        description: info.description,
        type: info.type || "N/A",
        unit: info.unit || "uds",
        recibidoBodega: 0,
        devueltoBodega: 0,
        gastadoOrdenes: 0,
        enManoActualmente: 0 // Se calculará despues del estado 'live'
      });
    }

    const itemStats = crewData.items.get(itemId);
    const type = mov._id.type;
    const qty = mov.totalQty;

    switch (type) {
      case "assignment":
        itemStats.recibidoBodega += Math.abs(qty); 
        break;
      case "return":
        itemStats.devueltoBodega += qty; // es positivo
        break;
      case "usage_order":
        itemStats.gastadoOrdenes += Math.abs(qty); // usage_order descuenta
        break;
    }
  });

  // 5. Popular la cantidad 'enManoActualmente' usando el assignedInventory de CrewModel
  crews.forEach((c: any) => {
    const cId = c._id.toString();
    const crewData = activeCrewsMap.get(cId);

    if (c.assignedInventory && Array.isArray(c.assignedInventory)) {
      c.assignedInventory.forEach((invLine: any) => {
        const itemObj = invLine.item;
        if (!itemObj) return;

        const itemId = itemObj._id?.toString() || itemObj.toString();
        
        // Si la cuadrilla tiene el item actualmente pero no tuvo movimientos en el periodo
        if (!crewData.items.has(itemId)) {
          crewData.items.set(itemId, {
            itemId: itemId,
            code: itemObj.code || "N/A",
            description: itemObj.description || "N/A",
            type: itemObj.type || "N/A",
            unit: itemObj.unit || "uds",
            recibidoBodega: 0,
            devueltoBodega: 0,
            gastadoOrdenes: 0,
            enManoActualmente: 0
          });
        }

        crewData.items.get(itemId).enManoActualmente = invLine.quantity || 0;
      });
    }
  });

  // 6. Transformar mapas anidados a array plano o por cuadrilla
  const resultData: any[] = [];
  
  // Convertimos a un arreglo ordenado por cuadrilla
  const sortedCrews = Array.from(activeCrewsMap.values()).sort((a, b) => a.crewNumber - b.crewNumber);
  
  sortedCrews.forEach(crew => {
    const itemsArray = Array.from(crew.items.values()).sort((a: any, b: any) => a.code.localeCompare(b.code));
    
    // Filtrar items sin nada
    const activeItems = itemsArray.filter((i: any) => 
      i.recibidoBodega > 0 || i.devueltoBodega > 0 || i.gastadoOrdenes > 0 || i.enManoActualmente > 0
    );

    if (activeItems.length > 0) {
      resultData.push({
        crewId: crew.crewId,
        crewNumber: crew.crewNumber,
        crewName: crew.crewName,
        items: activeItems
      });
    }
  });

  return resultData;
}

/**
 * Reporte: Órdenes en Cuadrillas (crew_orders)
 * Usa OrderSnapshot para mostrar el estado diario de órdenes por cuadrilla
 */
export async function getCrewOrdersReport(
  dateRange?: { start: string; end: string },
  crewId?: string
): Promise<any> {
  await connectDB();

  let startDate, endOfDayDate;
  if (dateRange) {
    startDate = getStartAndEndOfDay(dateRange.start).start;
    endOfDayDate = getStartAndEndOfDay(dateRange.end).end;
  } else {
    startDate = getStartOfMonthMTG4();
    endOfDayDate = getStartAndEndOfDay().end;
  }
  const endDate = endOfDayDate;

  // Obtener todos los OrderSnapshots del rango
  const snapshots = await OrderSnapshotModel.find({
    snapshotDate: { $gte: startDate, $lte: endOfDayDate },
  })
    .sort({ snapshotDate: 1 })
    .lean();

  // ─── 1. Construir resumen acumulado por cuadrilla ───
  const crewSummaryMap = new Map<string, {
    crewNumber: number;
    crewName: string;
    leaderName: string;
    // Totals
    pending: number;
    assigned: number;
    in_progress: number;
    completed: number;
    completed_special: number;
    completed_via500: number;
    cancelled: number;
    visita: number;
    hard: number;
    total: number;
    // Type Breakdown
    instalacion: { total: number; completed: number };
    averia: { total: number; completed: number };
    recuperacion: { total: number; completed: number };
    daysCount: number;
  }>();

  // ─── 2. Construir datos diarios para exportación ───
  const dailyData: any[] = [];

  for (const snap of snapshots) {
    const snapDate = format(new Date(snap.snapshotDate), "dd/MM/yyyy");

    for (const crewSnap of (snap as any).crewSnapshots || []) {
      const cId = crewSnap.crew?.toString() || "";
      if (crewId && cId !== crewId) continue;

      const crewKey = cId || `crew_${crewSnap.crewNumber}`;
      const orders = crewSnap.orders || {};
      const byType = crewSnap.byType || {};

      // Acumular en resumen (último snapshot gana para totales; sumamos días)
      if (!crewSummaryMap.has(crewKey)) {
        crewSummaryMap.set(crewKey, {
          crewNumber: crewSnap.crewNumber,
          crewName: `Cuadrilla ${crewSnap.crewNumber}`,
          leaderName: crewSnap.leaderName || "",
          pending: 0,
          assigned: 0,
          in_progress: 0,
          completed: 0,
          completed_special: 0,
          completed_via500: 0,
          cancelled: 0,
          visita: 0,
          hard: 0,
          total: 0,
          instalacion: { total: 0, completed: 0 },
          averia: { total: 0, completed: 0 },
          recuperacion: { total: 0, completed: 0 },
          daysCount: 0,
        });
      }

      const summary = crewSummaryMap.get(crewKey)!;
      // Usar los datos del último snapshot como estado final
      summary.pending = orders.pending || 0;
      summary.assigned = orders.assigned || 0;
      summary.in_progress = orders.in_progress || 0;
      summary.completed = (orders.completed || 0) + (orders.completed_special || 0) + (orders.completed_via500 || 0);
      summary.completed_special = orders.completed_special || 0;
      summary.completed_via500 = orders.completed_via500 || 0;
      summary.cancelled = orders.cancelled || 0;
      summary.visita = orders.visita || 0;
      summary.hard = orders.hard || 0;
      summary.total = orders.total || 0;

      // Update types
      // Note: "total" here refers to "total orders of this type in this state"
      // If we want "total completed of this type", we check byType.instalacion.completed
      if (byType.instalacion) {
        summary.instalacion.total = byType.instalacion.total || 0;
        summary.instalacion.completed = byType.instalacion.completed || 0;
      }
      if (byType.averia) {
        summary.averia.total = byType.averia.total || 0;
        summary.averia.completed = byType.averia.completed || 0;
      }
      if (byType.recuperacion) {
        summary.recuperacion.total = byType.recuperacion.total || 0;
        summary.recuperacion.completed = byType.recuperacion.completed || 0;
      }

      summary.daysCount++;

      // Datos diarios
      dailyData.push({
        date: snapDate,
        crewNumber: crewSnap.crewNumber,
        crewName: `Cuadrilla ${crewSnap.crewNumber}`,
        leaderName: crewSnap.leaderName || "",
        pending: orders.pending || 0,
        assigned: orders.assigned || 0,
        in_progress: orders.in_progress || 0,
        completed: (orders.completed || 0) + (orders.completed_special || 0) + (orders.completed_via500 || 0),
        completed_special: orders.completed_special || 0,
        completed_via500: orders.completed_via500 || 0,
        cancelled: orders.cancelled || 0,
        visita: orders.visita || 0,
        hard: orders.hard || 0,
        total: orders.total || 0,
        // Type data for daily pivot
        instalacion_total: byType.instalacion?.total || 0,
        instalacion_completed: byType.instalacion?.completed || 0,
        averia_total: byType.averia?.total || 0,
        averia_completed: byType.averia?.completed || 0,
        recuperacion_total: byType.recuperacion?.total || 0,
        recuperacion_completed: byType.recuperacion?.completed || 0,
      });
    }
  }

  // ─── 3. Fallback: Include ALL active crews via live query ───
  // Historical snapshots may not include all crews (e.g. crews with 0 orders).
  // Query all active crews and their current order counts to fill gaps.
  const crewFilter: any = { isActive: true };
  if (crewId) crewFilter._id = crewId;

  const allCrews = await CrewModel.find(crewFilter)
    .populate('leader', 'name surname')
    .select('number leader')
    .sort({ number: 1 })
    .lean();

  // Live aggregation of orders per crew within the date range
  const liveAggregation = await OrderModel.aggregate([
    {
      $match: {
        assignedTo: { $ne: null },
        ...(crewId ? { assignedTo: new mongoose.Types.ObjectId(crewId) } : {}),
      },
    },
    {
      $group: {
        _id: {
          crew: "$assignedTo",
          status: "$status",
          type: "$type",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.crew",
        statuses: {
          $push: {
            status: "$_id.status",
            type: "$_id.type",
            count: "$count",
          },
        },
        total: { $sum: "$count" },
      },
    },
  ]);

  const liveMap = new Map<string, any>();
  for (const entry of liveAggregation) {
    liveMap.set(entry._id.toString(), entry);
  }

  // Add missing crews to the summary map
  for (const crew of allCrews) {
    const cIdStr = (crew as any)._id.toString();
    if (crewSummaryMap.has(cIdStr)) continue; // Already in snapshot data

    const leaderName = (crew as any).leader
      ? `${(crew as any).leader.name} ${(crew as any).leader.surname}`
      : 'Sin líder';

    const liveEntry = liveMap.get(cIdStr);

    // Build summary from live data
    const summary: any = {
      crewNumber: (crew as any).number,
      crewName: `Cuadrilla ${(crew as any).number}`,
      leaderName,
      pending: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      completed_special: 0,
      completed_via500: 0,
      cancelled: 0,
      visita: 0,
      hard: 0,
      total: 0,
      instalacion: { total: 0, completed: 0 },
      averia: { total: 0, completed: 0 },
      recuperacion: { total: 0, completed: 0 },
      daysCount: 0,
    };

    if (liveEntry) {
      for (const { status, type, count } of liveEntry.statuses) {
        if (status) summary[status] = (summary[status] || 0) + count;

        const t = (type || 'otro').toLowerCase();
        if (['instalacion', 'averia', 'recuperacion'].includes(t)) {
          summary[t].total = (summary[t].total || 0) + count;
          if (COMPLETED_STATUSES.includes(status)) {
            summary[t].completed = (summary[t].completed || 0) + count;
          }
        }
      }
      summary.total = liveEntry.total;
      // Recalculate completed as sum of completed statuses
      summary.completed = (summary.completed || 0) + (summary.completed_special || 0) + (summary.completed_via500 || 0);
    }

    crewSummaryMap.set(cIdStr, summary);
  }

  // Ordenar crews por número
  const crews = Array.from(crewSummaryMap.values())
    .sort((a, b) => a.crewNumber - b.crewNumber)
    .map((c) => ({
      ...c, // Spread to include the nested type objects
    }));

  return { crews, dailySnapshots: dailyData };
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
