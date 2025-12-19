// lib/reportService.ts
// Servicio central para generación de reportes con agregaciones MongoDB

import { connectDB } from "@/lib/db";
import OrderModel from "@/models/Order";
import CrewModel from "@/models/Crew";
import InventoryModel from "@/models/Inventory";
import InventoryHistoryModel from "@/models/InventoryHistory";
import GeneratedReportModel from "@/models/GeneratedReport";
import { SessionUser } from "@/lib/authHelpers";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import type {
  DailyReportData,
  MonthlyReportData,
  InventoryReportData,
  NetunoReportData,
  CrewPerformanceData,
  CrewInventoryData,
  OrderSummary,
} from "@/types/reportTypes";

/**
 * 1. Reporte día a día de instalaciones/averías
 * Usuario selecciona fecha específica y obtiene órdenes finalizadas y asignadas de ese día
 */
export async function getDailyReport(
  date: string,
  type: "instalacion" | "averia" | "all" = "all",
  sessionUser?: SessionUser
): Promise<DailyReportData> {
  await connectDB();

  const filters: any = {
    filters: { startDate: date, endDate: date },
  };

  if (type !== "all") {
    filters.filters.type = type;
  }

  // Intentar usar caché con GeneratedReport
  const reportType = type === "all" ? "daily_installations" : `daily_${type}s`;

  const result = await GeneratedReportModel.findOrGenerate(
    reportType,
    filters.filters,
    async () => {
      // Generar reporte nuevo
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
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

      const orders = await OrderModel.find(baseFilter)
        .populate("assignedTo", "name")
        .lean();

      // Separar en finalizadas y asignadas
      const finalizadas = orders.filter((order) => order.status === "completed");
      const asignadas = orders.filter((order) =>
        ["assigned", "in_progress"].includes(order.status)  
      );

      return {
        finalizadas,
        asignadas,
        totales: {
          finalizadas: finalizadas.length,
          asignadas: asignadas.length,
        },
      };
    },
    sessionUser
  );

  return { ...result.data, cached: result.cached };
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
): Promise<MonthlyReportData> {
  await connectDB();

  const monthDate = new Date(year, month - 1, 1);
  const startDate = startOfMonth(monthDate);
  const endDate = endOfMonth(monthDate);

  const filters = {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
    type,
  };

  const reportType = type === "all" ? "monthly_installations" : `monthly_${type}s`;

  const result = await GeneratedReportModel.findOrGenerate(
    reportType,
    filters,
    async () => {
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

      if (type !== "all") {
        baseFilter.type = type;
      }

      // Agregación por día
      const dailyBreakdown = await OrderModel.aggregate([
        { $match: baseFilter },
        {
          $project: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: {
                  $cond: [
                    { $eq: ["$status", "completed"] },
                    "$completionDate",
                    "$assignmentDate",
                  ],
                },
              },
            },
            status: 1,
          },
        },
        {
          $group: {
            _id: "$date",
            finalizadas: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            asignadas: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["assigned", "in_progress"]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const breakdown = dailyBreakdown.map((day) => ({
        date: day._id,
        finalizadas: day.finalizadas,
        asignadas: day.asignadas,
      }));

      const totales = breakdown.reduce(
        (acc, day) => ({
          finalizadas: acc.finalizadas + day.finalizadas,
          asignadas: acc.asignadas + day.asignadas,
        }),
        { finalizadas: 0, asignadas: 0 }
      );

      return { breakdown, totales };
    },
    sessionUser
  );

  return { ...result.data, cached: result.cached };
}

/**
 * 3. Reporte de inventario
 * Material en instalaciones, averías, averiado y recuperado
 */
export async function getInventoryReport(
  dateRange: { start: string; end: string },
  sessionUser?: SessionUser
): Promise<InventoryReportData> {
  await connectDB();

  const result = await GeneratedReportModel.findOrGenerate(
    "inventory_report",
    dateRange,
    async () => {
      const startDate = parseISO(dateRange.start);
      const endDate = parseISO(dateRange.end);

      // Material usado en instalaciones
      const instalaciones = await InventoryHistoryModel.aggregate([
        {
          $match: {
            type: "usage_order",
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "orderInfo",
          },
        },
        { $unwind: "$orderInfo" },
        { $match: { "orderInfo.type": "instalacion" } },
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
          $group: {
            _id: "$item",
            code: { $first: "$itemInfo.code" },
            description: { $first: "$itemInfo.description" },
            usado: { $sum: "$quantityChange" },
          },
        },
      ]);

      // Material usado en averías
      const averias = await InventoryHistoryModel.aggregate([
        {
          $match: {
            type: "usage_order",
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "order",
            foreignField: "_id",
            as: "orderInfo",
          },
        },
        { $unwind: "$orderInfo" },
        { $match: { "orderInfo.type": "averia" } },
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
          $group: {
            _id: "$item",
            code: { $first: "$itemInfo.code" },
            description: { $first: "$itemInfo.description" },
            usado: { $sum: "$quantityChange" },
          },
        },
      ]);

      // Material averiado (adjustments con quantityChange negativo)
      const materialAveriado = await InventoryHistoryModel.aggregate([
        {
          $match: {
            type: "adjustment",
            quantityChange: { $lt: 0 },
            reason: /damaged|averiado/i,
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
          $group: {
            _id: "$item",
            code: { $first: "$itemInfo.code" },
            description: { $first: "$itemInfo.description" },
            quantity: { $sum: { $abs: "$quantityChange" } },
          },
        },
      ]);

      // Material recuperado (returns)
      const materialRecuperado = await InventoryHistoryModel.aggregate([
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
          $group: {
            _id: "$item",
            code: { $first: "$itemInfo.code" },
            description: { $first: "$itemInfo.description" },
            quantity: { $sum: "$quantityChange" },
          },
        },
      ]);

      return {
        instalaciones,
        averias,
        materialAveriado,
        materialRecuperado,
      };
    },
    sessionUser
  );

  return result.data;
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

  const pendientes = await OrderModel.find({
    googleFormReported: false,
    createdAt: { $gte: startDate, $lte: endDate },
  })
    .populate("assignedTo", "name")
    .lean();

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
    select: "name",
  });

  return populatedPerformance.map((crew) => ({
    crewId: crew._id._id.toString(),
    crewName: crew._id.name,
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
    .lean();

  return crews.map((crew) => ({
    crewId: crew._id.toString(),
    crewName: crew.name,
    inventory: (crew.assignedInventory || []).map((inv: any) => ({
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
 * Helper: Marcar órdenes como reportadas a Netuno
 */
export async function markOrdersAsReported(orderIds: string[]): Promise<void> {
  await connectDB();
  await OrderModel.updateMany(
    { _id: { $in: orderIds } },
    { $set: { googleFormReported: true } }
  );
}
