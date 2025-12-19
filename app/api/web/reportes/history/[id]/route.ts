// app/api/web/reportes/history/[id]/route.ts
// Endpoint para obtener o eliminar un reporte específico

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GeneratedReportModel from "@/models/GeneratedReport";
import { getUserFromRequest } from "@/lib/authHelpers";

/**
 * GET /api/web/reportes/history/[id]
 * Obtiene un reporte específico por ID (incluyendo datos completos)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const report = await GeneratedReportModel.findById(id)
      .populate("filters.crewId", "name")
      .populate("metadata.generatedBy", "name email")
      .lean();

    if (!report) {
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    console.error("Error fetching report:", error);
    return NextResponse.json(
      { error: "Error al obtener reporte", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/web/reportes/history/[id]
 * Elimina un reporte generado
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getUserFromRequest(request);
    if (!sessionUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;

    const deleted = await GeneratedReportModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Reporte eliminado correctamente",
    });
  } catch (error: any) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Error al eliminar reporte", details: error.message },
      { status: 500 }
    );
  }
}
