// lib/exports/exportToExcel.ts
// Exportación de reportes a formato Excel (.xlsx) con estilos

import * as XLSX from "xlsx";
import type { ReportType, ReportMetadata } from "@/types/reportTypes";

/**
 * Convierte una fecha a GMT-4 (hora de Venezuela) y la formatea
 */
function formatDateVenezuela(dateString: string): string {
  if (!dateString) return "-";
  const date = new Date(dateString);

  // Formatear la fecha en zona horaria de Venezuela (GMT-4)
  return date.toLocaleDateString('es-VE', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Exporta datos de reporte a archivo Excel con estilos
 */
export function exportReportToExcel(
  reportType: ReportType,
  data: any,
  metadata: ReportMetadata
): void {
  // Crear workbook
  const workbook = XLSX.utils.book_new();

  // Preparar datos según tipo de reporte
  let worksheetData: any[] = [];
  let sheetName = "Reporte";

  switch (reportType) {
    case "daily_installations":
    case "daily_repairs":
      // Nueva estructura agrupada por cuadrilla
      sheetName = "Órdenes del Día";
      const dailyOrders: any[] = [];

      // Filtrar cuadrillas si hay filtro activo
      const dailyCuadrillas = metadata.filters?.crewId
        ? (data.cuadrillas || []).filter((crew: any) => crew.crewId === metadata.filters.crewId)
        : (data.cuadrillas || []);

      dailyCuadrillas.forEach((crew: any) => {
        // Agregar completadas
        crew.completadas.forEach((order: any) => {
          dailyOrders.push({
            "Cuadrilla": crew.crewName,
            "Estado": "Completada",
            "Ticket": order.ticket || "N/A",
            "N° Abonado": order.subscriberNumber,
            "Nombre": order.subscriberName,
          });
        });

        // Agregar no completadas
        crew.noCompletadas.forEach((order: any) => {
          dailyOrders.push({
            "Cuadrilla": crew.crewName,
            "Estado": "Pendiente",
            "Ticket": order.ticket || "N/A",
            "N° Abonado": order.subscriberNumber,
            "Nombre": order.subscriberName,
          });
        });
      });
      worksheetData = dailyOrders;
      break;

    case "monthly_installations":
    case "monthly_repairs":
      // Misma estructura agrupada por cuadrilla
      sheetName = "Órdenes del Mes";
      const monthlyOrders: any[] = [];

      // Filtrar cuadrillas si hay filtro activo
      const monthlyCuadrillas = metadata.filters?.crewId
        ? (data.cuadrillas || []).filter((crew: any) => crew.crewId === metadata.filters.crewId)
        : (data.cuadrillas || []);

      monthlyCuadrillas.forEach((crew: any) => {
        // Agregar completadas
        crew.completadas.forEach((order: any) => {
          monthlyOrders.push({
            "Cuadrilla": crew.crewName,
            "Estado": "Completada",
            "Ticket": order.ticket || "N/A",
            "N° Abonado": order.subscriberNumber,
            "Nombre": order.subscriberName,
            "Fecha": formatDateVenezuela(order.completionDate),
          });
        });

        // Agregar no completadas
        crew.noCompletadas.forEach((order: any) => {
          monthlyOrders.push({
            "Cuadrilla": crew.crewName,
            "Estado": "Pendiente",
            "Ticket": order.ticket || "N/A",
            "N° Abonado": order.subscriberNumber,
            "Nombre": order.subscriberName,
            "Fecha": formatDateVenezuela(order.assignmentDate),
          });
        });
      });
      worksheetData = monthlyOrders;
      break;

    case "inventory_report":
      sheetName = "Inventario";
      // Combinar todas las categorías
      const allMaterials = [
        ...(data.instalaciones || []).map((item: any) => ({ ...item, categoría: "Instalaciones" })),
        ...(data.averias || []).map((item: any) => ({ ...item, categoría: "Averías" })),
        ...(data.materialAveriado || []).map((item: any) => ({ ...item, categoría: "Averiado" })),
        ...(data.materialRecuperado || []).map((item: any) => ({ ...item, categoría: "Recuperado" })),
      ];
      worksheetData = allMaterials.map((item: any) => ({
        "Código": item.code,
        "Descripción": item.description,
        "Categoría": item.categoría,
        "Cantidad": item.usado || item.quantity || 0,
      }));
      break;

    case "crew_performance":
      sheetName = "Rendimiento Cuadrillas";
      worksheetData = data.map((crew: any) => ({
        "Cuadrilla": crew.crewName,
        "Total Órdenes": crew.totalOrders,
        "Instalaciones": crew.instalaciones,
        "Averías": crew.averias,
        "Tiempo Promedio (días)": crew.tiempoPromedioDias,
      }));
      break;

    case "crew_inventory":
      sheetName = "Inventario Cuadrillas";
      const allCrewInventory: any[] = [];
      data.forEach((crew: any) => {
        crew.inventory.forEach((item: any) => {
          allCrewInventory.push({
            "Cuadrilla": crew.crewName,
            "Código": item.code,
            "Descripción": item.description,
            "Cantidad": item.quantity,
            "Unidad": item.unit,
          });
        });
      });
      worksheetData = allCrewInventory;
      break;

    case "crew_visits":
      sheetName = "Visitas por Cuadrilla";
      worksheetData = data.map((crew: any) => ({
        "Cuadrilla": crew.crewName,
        "Total Visitas": crew.totalVisits,
        "Instalaciones": crew.instalaciones,
        "Averías": crew.averias,
        "Recuperaciones": crew.recuperaciones,
        "Otros": crew.otros,
      }));
      break;

    case "netuno_orders":
      sheetName = "Órdenes Netuno";
      worksheetData = (data.pendientes || []).map((order: any) => ({
        "N° Abonado": order.subscriberNumber,
        "Nombre": order.subscriberName,
        "Tipo": order.type === "instalacion" ? "Instalación" : "Avería",
        "Nodo": order.node || "",
        "Servicios": Array.isArray(order.servicesToInstall)
          ? order.servicesToInstall.join(", ")
          : "",
        "Estado": order.status,
      }));
      break;
  }

  // Crear hoja de datos
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Auto-ajustar ancho de columnas
  const colWidths = Object.keys(worksheetData[0] || {}).map((key) => ({
    wch: Math.max(key.length, 15),
  }));
  worksheet["!cols"] = colWidths;

  // Añadir hoja de datos
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Crear hoja de metadatos
  const generatedDate = metadata.generatedAt instanceof Date
    ? metadata.generatedAt
    : new Date(metadata.generatedAt);

  const metadataSheet = XLSX.utils.json_to_sheet([
    { Campo: "Tipo de Reporte", Valor: reportType },
    { Campo: "Fecha de Generación", Valor: generatedDate.toLocaleString("es-ES") },
    { Campo: "Total de Registros", Valor: metadata.totalRecords },
    { Campo: "Desde", Valor: metadata.filters.startDate || "N/A" },
    { Campo: "Hasta", Valor: metadata.filters.endDate || "N/A" },
    { Campo: "Cacheado", Valor: metadata.cached ? "Sí" : "No" },
  ]);
  XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");

  // Mapeo de nombres de reportes a español
  const reportNames: Record<ReportType, string> = {
    daily_installations: "instalacion_diaria",
    daily_repairs: "averia_diaria",
    monthly_installations: "instalacion_mensual",
    monthly_repairs: "averia_mensual",
    inventory_report: "reporte_inventario",
    netuno_orders: "ordenes_netuno",
    crew_performance: "rendimiento_cuadrillas",
    crew_inventory: "inventario_cuadrillas",
    crew_visits: "visitas_cuadrillas",
  };

  // Generar nombre de archivo con fecha en GMT-4
  const now = new Date();
  const venezuelaDate = new Date(now.getTime() - (4 * 60 * 60 * 1000));
  const dateStr = venezuelaDate.toISOString().split("T")[0];
  const reportName = reportNames[reportType] || reportType;
  const fileName = `ENLARED_${reportName}_${dateStr}.xlsx`;


  // Descargar archivo
  XLSX.writeFile(workbook, fileName);
}
