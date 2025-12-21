// app/api/web/reportes/history/route.ts
// Endpoint para listar reportes generados previamente con paginación

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GeneratedReportModel from "@/models/GeneratedReport";
import { getUserFromRequest } from "@/lib/authHelpers";

/**
 * GET /api/web/reportes/history
 * Lista reportes generados previamente con paginación
 * 
 * Query params:
 * - page: número de página (default: 1)
 * - limit: registros por página (default: 20)
 * - reportType: filtrar por tipo (opcional)
 * - startDate: filtrar desde fecha (opcional)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const reportType = searchParams.get("reportType");
    const startDate = searchParams.get("startDate");

    // Construir filtro
    const filter: any = {};
    if (reportType) filter.reportType = reportType;
    if (startDate) {
      filter["filters.startDate"] = { $gte: startDate };
    }

    // Contar total
    const total = await GeneratedReportModel.countDocuments(filter);

    // Buscar reportes
    const reports = await GeneratedReportModel.find(filter)
      .select("-data") // Excluir datos pesados para listado
      .populate("filters.crewId", "name")
      .populate("metadata.generatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching report history:", error);
    return NextResponse.json(
      { error: "Error al obtener historial de reportes", details: error.message },
      { status: 500 }
    );
  }
}
