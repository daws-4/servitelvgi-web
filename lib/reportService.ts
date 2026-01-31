// lib/reportService.ts
// Servicio central para generación de reportes con agregaciones MongoDB

import { connectDB } from "@/lib/db";
import OrderModel from "@/models/Order";
import CrewModel from "@/models/Crew";
import InventoryModel from "@/models/Inventory";
import InventoryHistoryModel from "@/models/InventoryHistory";
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
  month: number,
  year: number,
  type: "instalacion" | "averia" | "all" = "all",
  sessionUser?: SessionUser
): Promise<DailyReportData> { // Reuse DailyReportData as structure is identical
  await connectDB();

  const monthDate = new Date(year, month - 1, 1);
  const startDate = startOfMonth(monthDate);
  const endDate = endOfMonth(monthDate);

  // Set end of day for the last day of month
  endDate.setHours(23, 59, 59, 999);

  console.log(`[DEBUG] getMonthlyReport Params: Month=${month}, Year=${year}, Type=${type}`);
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
    fecha: format(monthDate, "yyyy-MM"),
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
  sessionUser?: SessionUser
): Promise<NetunoReportData> {
  await connectDB();

  // NO cachear - debe ser siempre actualizado
  const startDate = parseISO(dateRange.start);
  const endDate = parseISO(dateRange.end);

  const rawPendientes = await OrderModel.find({
    googleFormReported: false,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate("assignedTo", "name")
    .lean();

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
export async function getCrewPerformanceReport(
  dateRange: { start: string; end: string },
  sessionUser?: SessionUser
): Promise<CrewPerformanceData[]> {
  await connectDB();

  const startDate = parseISO(dateRange.start);
  const endDate = parseISO(dateRange.end);

  const performance = await OrderModel.aggregate([
    {
      $match: {
        status: "completed",
        completionDate: { $gte: startDate, $lte: endDate },
        assignedTo: { $exists: true },
      },
    },
    {
      $group: {
        _id: "$assignedTo",
        totalOrders: { $sum: 1 },
        instalaciones: {
          $sum: { $cond: [{ $eq: ["$type", "instalacion"] }, 1, 0] },
        },
        averias: {
          $sum: { $cond: [{ $eq: ["$type", "averia"] }, 1, 0] },
        },
        avgDays: {
          $avg: {
            $divide: [
              { $subtract: ["$completionDate", "$assignmentDate"] },
              1000 * 60 * 60 * 24, // Convertir ms a días
            ],
          },
        },
      },
    },
    { $sort: { totalOrders: -1 } },
  ]);

  // Populate crew names
  const populatedPerformance = await CrewModel.populate(performance, {
    path: "_id",
    select: "number",
  });

  return populatedPerformance.map((crew) => ({
    crewId: crew._id._id.toString(),
    crewNumber: crew._id.number,
    totalOrders: crew.totalOrders,
    instalaciones: crew.instalaciones,
    averias: crew.averias,
    tiempoPromedioDias: Math.round(crew.avgDays * 10) / 10, // 1 decimal
  }));
}

/**
 * 6. Reporte de inventario por cuadrilla
 * Inventario asignado a cada cuadrilla
 */
export async function getCrewInventoryReport(
  crewId?: string
): Promise<CrewInventoryData[]> {
  await connectDB();

  const filter: any = { isActive: true };
  if (crewId) {
    filter._id = crewId;
  }

  const crews = await CrewModel.find(filter)
    .populate("assignedInventory.item", "code description unit")
    .lean<CrewDocument[]>();

  return crews.map((crew) => ({
    crewId: crew._id.toString(),
    crewNumber: crew.number,
    inventory: (crew.assignedInventory || []).map((inv) => ({
      itemId: inv.item._id.toString(),
      code: inv.item.code,
      description: inv.item.description,
      quantity: inv.quantity,
      unit: inv.item.unit,
      lastUpdated: inv.lastUpdated,
    })),
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
 * Helper: Marcar órdenes como reportadas a Netuno
 */
export async function markOrdersAsReported(orderIds: string[]): Promise<void> {
  await connectDB();
  await OrderModel.updateMany(
    { _id: { $in: orderIds } },
    { $set: { googleFormReported: true } }
  );
}
