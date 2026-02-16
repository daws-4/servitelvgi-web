// lib/exports/exportToPDF.ts
// Exportación de reportes a formato PDF con jsPDF y autoTable

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportType, ReportMetadata } from "@/types/reportTypes";

/**
 * Exporta datos de reporte a archivo PDF con tablas formateadas
 */
export function exportReportToPDF(
  reportType: ReportType,
  data: any,
  metadata: ReportMetadata
): void {
  // Crear documento PDF en orientación landscape para tablas anchas
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Header
  doc.setFontSize(18);
  doc.text("ENLARED GI - Reporte", 14, 15);

  doc.setFontSize(11);
  doc.text(`Tipo: ${getReportTypeName(reportType)}`, 14, 22);

  // Handle generatedAt as either Date object or string
  const generatedDate = metadata.generatedAt instanceof Date
    ? metadata.generatedAt
    : new Date(metadata.generatedAt);
  doc.text(
    `Generado: ${generatedDate.toLocaleDateString("es-ES")}`,
    14,
    27
  );

  // Preparar columnas y filas según tipo de reporte
  let columns: string[] = [];
  let rows: any[][] = [];

  switch (reportType) {
    case "daily_installations":
    case "daily_repairs":
    case "monthly_installations":
    case "monthly_repairs":
    case "monthly_recoveries":
      columns = ["N° Abonado", "Nombre", "Dirección", "Tipo", "Estado", "Cuadrilla"];
      const allOrders: any[] = [];

      // Flatten cuadrillas data
      (data.cuadrillas || []).forEach((crew: any) => {
        // Add completed
        (crew.completadas || []).forEach((order: any) => {
          allOrders.push({ ...order, statusDisplayName: "Finalizada", crewName: crew.crewName });
        });
        // Add not completed
        (crew.noCompletadas || []).forEach((order: any) => {
          allOrders.push({ ...order, statusDisplayName: "Pendiente", crewName: crew.crewName });
        });
      });

      rows = allOrders.map((order: any) => [
        order.subscriberNumber,
        order.subscriberName?.substring(0, 25) || "",
        order.address?.substring(0, 30) || "",
        order.type === "instalacion" ? "Instalación" : order.type === "averia" ? "Avería" : "Recuperación",
        order.statusDisplayName,
        order.crewName || "N/A",
      ]);
      break;

    case "inventory_report":
      columns = ["Código", "Descripción", "Categoría", "Cantidad"];
      const categories = [
        { items: data.instalaciones, cat: "Instalaciones" },
        { items: data.averias, cat: "Averías" },
        { items: data.materialAveriado, cat: "Averiado" },
        { items: data.materialRecuperado, cat: "Recuperado" },
      ];
      categories.forEach(({ items, cat }) => {
        (items || []).forEach((item: any) => {
          rows.push([
            item.code,
            item.description?.substring(0, 40) || "",
            cat,
            item.usado || item.quantity || 0,
          ]);
        });
      });
      break;

    case "crew_performance":
      columns = ["Cuadrilla", "Total", "Instalaciones", "Averías", "Tiempo Prom."];
      rows = data.map((crew: any) => [
        crew.crewName,
        crew.totalOrders,
        crew.instalaciones,
        crew.averias,
        `${crew.tiempoPromedioDias} días`,
      ]);
      break;

    case "crew_inventory":
      columns = ["Cuadrilla", "Código", "Descripción", "Cantidad"];
      data.forEach((crew: any) => {
        crew.inventory.forEach((item: any) => {
          rows.push([
            crew.crewName,
            item.code,
            item.description?.substring(0, 35) || "",
            item.quantity,
          ]);
        });
      });
      break;

    case "crew_stock":
      columns = ["Cuadrilla", "Código", "Descripción", "Inicial", "Final", "Dif."];
      (data.crews || []).forEach((crew: any) => {
        (crew.inventory || []).forEach((item: any) => {
          rows.push([
            crew.crewName,
            item.code,
            item.description?.substring(0, 35) || "",
            item.startQty,
            item.endQty,
            item.diff > 0 ? `+${item.diff}` : item.diff,
          ]);
        });
      });
      break;

    case "crew_orders":
      columns = ["Cuadrilla", "Líder", "Total", "Inst.", "Aver.", "Rec.", "Asig.", "Proc.", "Comp.", "Canc.", "Vis.", "Pend."];
      rows = (data.crews || []).map((crew: any) => [
        crew.crewName,
        crew.leaderName?.substring(0, 20) || "",
        crew.total,
        crew.instalacion?.total || 0,
        crew.averia?.total || 0,
        crew.recuperacion?.total || 0,
        crew.assigned,
        crew.in_progress,
        crew.completed,
        crew.cancelled,
        crew.visita,
        crew.pending,
      ]);
      break;

    case "crew_visits":
      columns = ["Cuadrilla", "Total Visitas", "Instalaciones", "Averías", "Recuperaciones", "Otros"];
      rows = data.map((crew: any) => [
        crew.crewName,
        crew.totalVisits,
        crew.instalaciones,
        crew.averias,
        crew.recuperaciones,
        crew.otros,
      ]);
      break;

    case "netuno_orders":
      columns = ["N° Abonado", "Nombre", "Tipo", "Nodo", "Estado"];
      rows = (data.pendientes || []).map((order: any) => [
        order.subscriberNumber,
        order.subscriberName?.substring(0, 25) || "",
        order.type === "instalacion" ? "Instalación" : "Avería",
        order.node || "",
        order.status,
      ]);
      break;
  }

  // Generar tabla con autoTable
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 32,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [68, 114, 196], // Azul corporativo
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 32 },
  });

  // Footer con totales
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text(`Total de registros: ${metadata.totalRecords}`, 14, finalY);

  // Generar nombre de archivo
  let fileName: string;

  if (reportType === 'crew_visits') {
    const crewNumber = metadata.filters.crewId ? 'cuadrilla_especifica' : 'todas';
    const startDate = new Date(metadata.filters.startDate);
    const endDate = new Date(metadata.filters.endDate);
    const monthStr = startDate.getMonth() === endDate.getMonth()
      ? startDate.toLocaleDateString('es-ES', { month: 'short' })
      : `${startDate.toLocaleDateString('es-ES', { month: 'short' })}-${endDate.toLocaleDateString('es-ES', { month: 'short' })}`;
    const timestamp = new Date().getTime();
    fileName = `visitas_cuadrilla_${crewNumber}_${monthStr}_${timestamp}.pdf`;
  } else {
    const dateStr = new Date().toISOString().split("T")[0];
    fileName = `ENLARED_${reportType}_${dateStr}.pdf`;
  }

  // Descargar PDF
  doc.save(fileName);
}

function getReportTypeName(type: ReportType): string {
  const names: Record<ReportType, string> = {
    daily_installations: "Diario - Instalaciones",
    daily_repairs: "Diario - Averías",
    monthly_installations: "Mensual - Instalaciones",
    monthly_repairs: "Mensual - Averías",
    monthly_recoveries: "Mensual - Recuperaciones",
    inventory_report: "Inventario",
    netuno_orders: "Órdenes Netuno",
    crew_performance: "Rendimiento Cuadrillas",
    crew_stock: "Inventario en Cuadrillas (Stock)", // Added
    crew_inventory: "Inventario Cuadrillas",
    crew_visits: "Visitas por Cuadrilla",
    crew_orders: "Órdenes en Cuadrillas",
  };
  return names[type] || type;
}
