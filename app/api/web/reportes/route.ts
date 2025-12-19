// app/api/web/reportes/route.ts
// API Endpoint principal para generación de reportes

import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/authHelpers";
import {
  getDailyReport,
  getMonthlyReport,
  getInventoryReport,
  getNetunoOrdersReport,
  getCrewPerformanceReport,
  getCrewInventoryReport,
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
    const sessionUser = await getSessionFromRequest(request);
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
        if (!startDate) {
          return NextResponse.json(
            { error: "El parámetro 'startDate' es requerido para reportes diarios" },
            { status: 400 }
          );
        }
        
        const dailyType = reportType === "daily_installations" ? "instalacion" : "averia";
        data = await getDailyReport(startDate, dailyType, sessionUser);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { date: startDate, type: dailyType },
          totalRecords: data.totales.finalizadas + data.totales.asignadas,
          cached: data.cached,
        };
        break;

      case "monthly_installations":
      case "monthly_repairs":
        if (!startDate) {
          return NextResponse.json(
            { error: "El parámetro 'startDate' es requerido para reportes mensuales" },
            { status: 400 }
          );
        }

        const [year, month] = startDate.split("-").map(Number);
        const monthlyType = reportType === "monthly_installations" ? "instalacion" : "averia";
        
        data = await getMonthlyReport(month, year, monthlyType, sessionUser);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { month, year, type: monthlyType },
          totalRecords: data.totales.finalizadas + data.totales.asignadas,
          cached: data.cached,
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
            data.instalaciones.length +
            data.averias.length +
            data.materialAveriado.length +
            data.materialRecuperado.length,
        };
        break;

      case "netuno_orders":
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: "Los parámetros 'startDate' y 'endDate' son requeridos" },
            { status: 400 }
          );
        }

        data = await getNetunoOrdersReport({ start: startDate, end: endDate }, sessionUser);
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

        data = await getCrewPerformanceReport({ start: startDate, end: endDate }, sessionUser);
        metadata = {
          reportType,
          generatedAt: new Date(),
          filters: { startDate, endDate },
          totalRecords: data.length,
        };
        break;

      case "crew_inventory":
        data = await getCrewInventoryReport(crewId || undefined);
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
