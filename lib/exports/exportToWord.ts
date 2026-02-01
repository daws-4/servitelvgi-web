// lib/exports/exportToWord.ts
// Exportación de reportes a formato Word (.docx) usando docx y file-saver

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import type { ReportType, ReportMetadata } from "@/types/reportTypes";

/**
 * Exporta datos de reporte a archivo Word (.docx)
 */
export async function exportReportToWord(
  reportType: ReportType,
  data: any,
  metadata: ReportMetadata
): Promise<void> {
  // Header paragraphs
  const headerParagraphs = [
    new Paragraph({
      text: "ENLARED GI - Reporte",
      heading: "Heading1",
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Tipo de Reporte: `,
          bold: true,
        }),
        new TextRun(getReportTypeName(reportType)),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Fecha de Generación: `,
          bold: true,
        }),
        new TextRun(metadata.generatedAt.toLocaleString("es-ES")),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Total de Registros: `,
          bold: true,
        }),
        new TextRun(String(metadata.totalRecords)),
      ],
      spacing: { after: 300 },
    }),
  ];

  // Preparar tabla según tipo de reporte
  let tableHeaders: string[] = [];
  let tableRows: any[][] = [];

  switch (reportType) {
    case "daily_installations":
    case "daily_repairs":
    case "monthly_installations":
    case "monthly_repairs":
    case "monthly_recoveries":
      tableHeaders = ["N° Abonado", "Nombre", "Dirección", "Tipo", "Estado", "Cuadrilla"];
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

      tableRows = allOrders.map((order: any) => [
        order.subscriberNumber,
        order.subscriberName || "",
        order.address || "",
        order.type === "instalacion" ? "Instalación" : order.type === "averia" ? "Avería" : "Recuperación",
        order.statusDisplayName,
        order.crewName || "N/A",
      ]);
      break;

    case "inventory_report":
      tableHeaders = ["Código", "Descripción", "Categoría", "Cantidad"];
      const categories = [
        { items: data.instalaciones, cat: "Instalaciones" },
        { items: data.averias, cat: "Averías" },
        { items: data.materialAveriado, cat: "Averiado" },
        { items: data.materialRecuperado, cat: "Recuperado" },
      ];
      categories.forEach(({ items, cat }) => {
        (items || []).forEach((item: any) => {
          tableRows.push([
            item.code,
            item.description || "",
            cat,
            String(item.usado || item.quantity || 0),
          ]);
        });
      });
      break;

    case "crew_performance":
      tableHeaders = ["Cuadrilla", "Total Órdenes", "Instalaciones", "Averías", "Tiempo Promedio"];
      tableRows = data.map((crew: any) => [
        crew.crewName,
        String(crew.totalOrders),
        String(crew.instalaciones),
        String(crew.averias),
        `${crew.tiempoPromedioDias} días`,
      ]);
      break;

    case "crew_inventory":
      tableHeaders = ["Cuadrilla", "Código", "Descripción", "Cantidad", "Unidad"];
      data.forEach((crew: any) => {
        crew.inventory.forEach((item: any) => {
          tableRows.push([
            crew.crewName,
            item.code,
            item.description || "",
            String(item.quantity),
            item.unit || "",
          ]);
        });
      });
      break;

    case "crew_stock":
      tableHeaders = ["Cuadrilla", "Código", "Descripción", "Inicial", "Final", "Diferencia"];
      data.forEach((crew: any) => {
        crew.inventory.forEach((item: any) => {
          tableRows.push([
            crew.crewName,
            item.code,
            item.description || "",
            String(item.startQty),
            String(item.endQty),
            String(item.diff),
          ]);
        });
      });
      break;

    case "netuno_orders":
      tableHeaders = ["N° Abonado", "Nombre", "Tipo", "Nodo", "Estado"];
      tableRows = (data.pendientes || []).map((order: any) => [
        order.subscriberNumber,
        order.subscriberName || "",
        order.type === "instalacion" ? "Instalación" : "Avería",
        order.node || "",
        order.status,
      ]);
      break;

    case "crew_visits":
      tableHeaders = ["Cuadrilla", "Total Visitas", "Instalaciones", "Averías", "Recuperaciones", "Otros"];
      tableRows = (Array.isArray(data) ? data : []).map((crew: any) => [
        crew.crewName || "",
        String(crew.totalVisits || 0),
        String(crew.instalaciones || 0),
        String(crew.averias || 0),
        String(crew.recuperaciones || 0),
        String(crew.otros || 0),
      ]);
      break;
  }

  // Crear tabla con docx
  const table = new Table({
    rows: [
      // Header row
      new TableRow({
        children: tableHeaders.map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  text: header,
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: {
                fill: "4472C4", // Azul corporativo
              },
            })
        ),
      }),
      // Data rows
      ...tableRows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph(String(cell))],
                })
            ),
          })
      ),
    ],
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
  });

  // Crear documento
  const doc = new Document({
    sections: [
      {
        children: [...headerParagraphs, table],
      },
    ],
  });

  // Generar blob y descargar
  const blob = await Packer.toBlob(doc);
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `ENLARED_${reportType}_${dateStr}.docx`;

  saveAs(blob, fileName);
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
  };
  return names[type] || type;
}
