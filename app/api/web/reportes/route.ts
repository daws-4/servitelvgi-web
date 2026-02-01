// app/api/web/reportes/route.ts
// API Endpoint principal para generación de reportes

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/authHelpers";
import {
  getDailyReport,
  getMonthlyReport,
  getInventoryReport,
  getNetunoOrdersReport,
  getCrewPerformanceReport,
  getCrewInventoryReport,
  getCrewVisitsReport,
  getCrewStockReport,
} from "@/lib/reportService";

/**
 * GET /api/web/reportes
 * Genera un reporte según los parámetros especificados
 * 
 * Query params:
 * - type: tipo de reporte (required)
 * - startDate: fecha inicio (required para la mayoría)
 * - endDate: fecha fin (optional, default = startDate)
 * - crewId: ID de cuadrilla (optional)
 * - orderType: 'instalacion' | 'averia' | 'all' (optional, default = 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate") || startDate;
    const crewId = searchParams.get("crewId");
    const orderType = (searchParams.get("orderType") || "all") as "instalacion" | "averia" | "all";

    if (!reportType) {
      return NextResponse.json(
        { error: "El parámetro 'type' es requerido" },
        { status: 400 }
      );
    }

    let data: any;
    let metadata: any;

    switch (reportType) {
      case "daily_installations":
      case "daily_repairs":
        // No requiere fecha - siempre usa fecha actual
        const dailyType = reportType === "daily_installations" ? "instalacion" : "averia";
        data = await getDailyReport(dailyType, sessionUser);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { date: data.fecha, type: dailyType },
          totalRecords: data.totales.completadas + data.totales.noCompletadas,
        };
        break;

      case "monthly_installations":
      case "monthly_repairs":
      case "monthly_recoveries":
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: "Los parámetros 'startDate' y 'endDate' son requeridos para reportes mensuales" },
            { status: 400 }
          );
        }

        let monthlyType: "instalacion" | "averia" | "recuperacion" = "instalacion";
        if (reportType === "monthly_repairs") monthlyType = "averia";
        if (reportType === "monthly_recoveries") monthlyType = "recuperacion";

        data = await getMonthlyReport({ start: startDate, end: endDate }, monthlyType, sessionUser);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { startDate, endDate, type: monthlyType },
          totalRecords: data.totales.completadas + data.totales.noCompletadas,
        };
        break;

      case "inventory_report":
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: "Los parámetros 'startDate' y 'endDate' son requeridos" },
            { status: 400 }
          );
        }

        data = await getInventoryReport({ start: startDate, end: endDate }, sessionUser);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { startDate, endDate },
          totalRecords:
            (data.entradasNetuno?.length || 0) +
            (data.salidasCuadrillas?.length || 0) +
            (data.devolucionesInventario?.length || 0),
        };
        break;

      case "netuno_orders":
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: "Los parámetros 'startDate' y 'endDate' son requeridos" },
            { status: 400 }
          );
        }

        data = await getNetunoOrdersReport({ start: startDate, end: endDate }, sessionUser, crewId || undefined);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { startDate, endDate },
          totalRecords: data.pendientes.length,
        };
        break;

      case "crew_performance":
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: "Los parámetros 'startDate' y 'endDate' son requeridos" },
            { status: 400 }
          );
        }

        data = await getCrewPerformanceReport({ start: startDate, end: endDate }, sessionUser, crewId || undefined);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { startDate, endDate, crewId: crewId || "all" },
          totalRecords: (data.orders || []).length, // Count total orders
        };
        break;

      case "crew_inventory":
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: "Los parámetros 'startDate' y 'endDate' son requeridos" },
            { status: 400 }
          );
        }

        data = await getCrewInventoryReport({ start: startDate, end: endDate }, sessionUser, crewId || undefined);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { startDate, endDate, crewId: crewId || "all" },
          totalRecords: data.length,
        };
        break;

      case "crew_visits":
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: "Los parámetros 'startDate' y 'endDate' son requeridos" },
            { status: 400 }
          );
        }

        data = await getCrewVisitsReport({ start: startDate, end: endDate }, sessionUser);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { startDate, endDate },
          totalRecords: data.length,
        };
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { startDate, endDate },
          totalRecords: data.length,
        };
        break;

      case "crew_stock":
        data = await getCrewStockReport(startDate && endDate ? { start: startDate, end: endDate } : undefined, crewId || undefined);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { crewId: crewId || "all" },
          totalRecords: data.length,
        };
        break;

      default:
        return NextResponse.json(
          { error: `Tipo de reporte desconocido: ${reportType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data,
      metadata,
    });
  } catch (error: any) {
    console.error("Error generando reporte:", error);
    return NextResponse.json(
      {
        error: "Error al generar reporte",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
