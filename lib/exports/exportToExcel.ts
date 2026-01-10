// lib/exports/exportToExcel.ts
// Exportación de reportes a formato Excel (.xlsx) con estilos

import * as XLSX from "xlsx";
import type { ReportType, ReportMetadata } from "@/types/reportTypes";

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
    case "monthly_installations":
    case "monthly_repairs":
      // Data tiene estructura { finalizadas: [], asignadas: [], totales: {} }
      sheetName = "Órdenes";
      const allOrders = [...(data.finalizadas || []), ...(data.asignadas || [])];
      worksheetData = allOrders.map((order: any) => ({
        "N° Abonado": order.subscriberNumber,
        "Nombre": order.subscriberName,
        "Dirección": order.address?.substring(0, 50) || "",
        "Tipo": order.type === "instalacion" ? "Instalación" : "Avería",
        "Estado": order.status === "completed" ? "Finalizada" : "Asignada",
        "Cuadrilla": order.assignedTo?.name || "Sin asignar",
        "Fecha": order.completionDate || order.assignmentDate || "",
      }));
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
  const metadataSheet = XLSX.utils.json_to_sheet([
    { Campo: "Tipo de Reporte", Valor: reportType },
    { Campo: "Fecha de Generación", Valor: metadata.generatedAt.toLocaleString("es-ES") },
    { Campo: "Total de Registros", Valor: metadata.totalRecords },
    { Campo: "Desde", Valor: metadata.filters.startDate || "N/A" },
    { Campo: "Hasta", Valor: metadata.filters.endDate || "N/A" },
    { Campo: "Cacheado", Valor: metadata.cached ? "Sí" : "No" },
  ]);
  XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");

  // Generar nombre de archivo
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `ENLARED_${reportType}_${dateStr}.xlsx`;

  // Descargar archivo
  XLSX.writeFile(workbook, fileName);
}
