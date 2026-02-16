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
    case "monthly_recoveries":
      // Misma estructura agrupada por cuadrilla
      sheetName = "Órdenes del Período";
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
      sheetName = "Rendimiento Detallado";
      worksheetData = (data.orders || []).map((order: any) => ({
        "Cuadrilla": order.crewName,
        "Ticket": order.ticket,
        "Abonado": order.subscriber,
        "Creado": formatDateVenezuela(order.createdAt),
        "Completado": formatDateVenezuela(order.updatedAt),
        "Duración": order.duration,
      }));
      break;

    case "crew_inventory":
      sheetName = "Movimientos Cuadrillas";
      worksheetData = data.map((item: any) => ({
        "Fecha": formatDateVenezuela(item.date),
        "Cuadrilla": item.crewName,
        "Tipo": item.type === 'assignment' ? 'Asignación' : item.type === 'return' ? 'Devolución' : 'Gasto en Orden',
      }));
      break;

    case "crew_stock": {
      sheetName = "Resumen Stock";
      // Hoja 1: Resumen
      (data.crews || []).forEach((crew: any) => {
        (crew.inventory || []).forEach((item: any) => {
          worksheetData.push({
            "Cuadrilla": crew.crewName,
            "Código": item.code,
            "Descripción": item.description,
            "Inicial": item.startQty,
            "Final": item.endQty,
            "Diferencia": item.diff
          });
        });
      });

      // Hoja 2: Detalle Diario (se añade después del switch)
      // Se almacenan los datos diarios para crear una segunda hoja
      break;
    }

    case "crew_orders": {
      sheetName = "Resumen Órdenes";
      (data.crews || []).forEach((crew: any) => {
        worksheetData.push({
          "Cuadrilla": crew.crewName,
          "Líder": crew.leaderName,
          "Total": crew.total,
          "Inst.": crew.instalacion?.total || 0,
          "Aver.": crew.averia?.total || 0,
          "Rec.": crew.recuperacion?.total || 0,
          "Asignadas": crew.assigned,
          "En Proceso": crew.in_progress,
          "Completadas": crew.completed,
          "Canceladas": crew.cancelled,
          "Visitas": crew.visita,
          "Pendientes": crew.pending,
        });
      });
      break;
    }

    case "crew_visits":
      sheetName = "Visitas por Cuadrilla";
      worksheetData = (Array.isArray(data) ? data : []).map((crew: any) => ({
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
        "Cuadrilla": (order.assignedTo?.number !== undefined && order.assignedTo?.number !== null) ? `Cuadrilla ${order.assignedTo.number}` : "S/A",
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

  // Hoja 2: Detalle diario con avance por fecha (pivot)
  if (reportType === "crew_stock") {
    // 1. Obtener todas las fechas únicas, ordenadas cronológicamente
    const allDates: string[] = [];
    const dateSet = new Set<string>();
    for (const snap of (data.dailySnapshots || [])) {
      if (!dateSet.has(snap.date)) {
        dateSet.add(snap.date);
        allDates.push(snap.date);
      }
    }
    // Ordenar fechas cronológicamente
    allDates.sort((a, b) => {
      const [dA, mA, yA] = a.split("/").map(Number);
      const [dB, mB, yB] = b.split("/").map(Number);
      return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
    });

    // 2. Indexar snapshots diarios: crewName+code -> { date -> quantity }
    const dailyIndex = new Map<string, Map<string, number>>();
    for (const snap of (data.dailySnapshots || [])) {
      const key = `${snap.crewName}||${snap.code}`;
      if (!dailyIndex.has(key)) {
        dailyIndex.set(key, new Map());
      }
      dailyIndex.get(key)!.set(snap.date, snap.quantity);
    }

    // 3. Construir filas pivot desde los datos del resumen (crews)
    const pivotRows: any[] = [];

    for (const crew of (data.crews || [])) {
      for (const item of (crew.inventory || [])) {
        const row: any = {
          "Cuadrilla": crew.crewName,
          "Código": item.code,
          "Descripción": item.description,
          "Inicial": item.startQty,
        };

        // Columnas por cada fecha
        const key = `${crew.crewName}||${item.code}`;
        const snapsByDate = dailyIndex.get(key);

        for (const date of allDates) {
          const dayQty = snapsByDate?.get(date) ?? "";
          row[date] = dayQty;
          // Diferencia del día = Inicial - cantidad del día
          row[`Dif ${date}`] = dayQty !== "" ? item.startQty - (dayQty as number) : "";
        }

        row["Final"] = item.endQty;
        row["Diferencia"] = item.diff;

        pivotRows.push(row);
      }
    }

    if (pivotRows.length > 0) {
      const pivotSheet = XLSX.utils.json_to_sheet(pivotRows);
      // Ancho de columnas: fijas + dinámicas
      const pivotColWidths: { wch: number }[] = [
        { wch: 18 },  // Cuadrilla
        { wch: 16 },  // Código
        { wch: 35 },  // Descripción
        { wch: 10 },  // Inicial
      ];
      for (const _date of allDates) {
        pivotColWidths.push({ wch: 12 }); // fecha
        pivotColWidths.push({ wch: 12 }); // dif fecha
      }
      pivotColWidths.push({ wch: 10 }); // Final
      pivotColWidths.push({ wch: 12 }); // Diferencia
      pivotSheet["!cols"] = pivotColWidths;
      XLSX.utils.book_append_sheet(workbook, pivotSheet, "Detalle Diario");
    }
  }

  // Hoja 2: Detalle diario para crew_orders (pivot por fecha)
  if (reportType === "crew_orders") {
    // Obtener fechas únicas ordenadas
    const allDates: string[] = [];
    const dateSet = new Set<string>();
    for (const snap of (data.dailySnapshots || [])) {
      if (!dateSet.has(snap.date)) {
        dateSet.add(snap.date);
        allDates.push(snap.date);
      }
    }
    allDates.sort((a, b) => {
      const [dA, mA, yA] = a.split("/").map(Number);
      const [dB, mB, yB] = b.split("/").map(Number);
      return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
    });

    // Indexar: crewName -> { date -> snapshot data }
    const dailyIndex = new Map<string, Map<string, any>>();
    for (const snap of (data.dailySnapshots || [])) {
      if (!dailyIndex.has(snap.crewName)) {
        dailyIndex.set(snap.crewName, new Map());
      }
      dailyIndex.get(snap.crewName)!.set(snap.date, snap);
    }

    // Construir filas pivot
    const pivotRows: any[] = [];
    const statusKeys = [
      "total",
      "instalacion_total", "instalacion_completed",
      "averia_total", "averia_completed",
      "recuperacion_total", "recuperacion_completed",
      "assigned", "in_progress", "completed", "cancelled", "visita", "pending"
    ];
    const statusLabels: Record<string, string> = {
      total: "Global Total",
      instalacion_total: "Inst. Total",
      instalacion_completed: "Inst. Comp.",
      averia_total: "Aver. Total",
      averia_completed: "Aver. Comp.",
      recuperacion_total: "Rec. Total",
      recuperacion_completed: "Rec. Comp.",
      assigned: "Asignadas",
      in_progress: "En Proceso",
      completed: "Completadas",
      cancelled: "Canceladas",
      visita: "Visitas",
      pending: "Pendientes",
    };

    for (const crew of (data.crews || [])) {
      // Una fila por cada status
      for (const sKey of statusKeys) {
        const row: any = {
          "Cuadrilla": crew.crewName,
          "Líder": crew.leaderName || "",
          "Estado": statusLabels[sKey] || sKey,
        };

        const crewDayMap = dailyIndex.get(crew.crewName);
        for (const date of allDates) {
          const daySnap = crewDayMap?.get(date);
          row[date] = daySnap ? (daySnap[sKey] ?? 0) : "";
        }

        // Último valor (resumen)
        // For type fields, extraction is tricky because they are nested in 'crew' object in summary
        // but flat in the daily snapshot.
        // The summary object has { instalacion: { total, completed } }
        // We need to map sKey to summary path.

        let lastVal = 0;
        if (sKey.includes("_")) {
          const [type, metric] = sKey.split("_"); // e.g. "instalacion", "total"
          lastVal = (crew[type] as any)?.[metric] || 0;
        } else {
          lastVal = (crew as any)[sKey] ?? 0;
        }

        row["Último"] = lastVal;

        pivotRows.push(row);
      }

      // Fila separadora entre cuadrillas
      const sepRow: any = { "Cuadrilla": "", "Líder": "", "Estado": "" };
      for (const date of allDates) sepRow[date] = "";
      sepRow["Último"] = "";
      pivotRows.push(sepRow);
    }

    if (pivotRows.length > 0) {
      const pivotSheet = XLSX.utils.json_to_sheet(pivotRows);
      const pivotColWidths: { wch: number }[] = [
        { wch: 18 },  // Cuadrilla
        { wch: 18 },  // Líder
        { wch: 14 },  // Estado
      ];
      for (const _date of allDates) {
        pivotColWidths.push({ wch: 12 });
      }
      pivotColWidths.push({ wch: 10 }); // Último
      pivotSheet["!cols"] = pivotColWidths;
      XLSX.utils.book_append_sheet(workbook, pivotSheet, "Detalle Diario");
    }
  }

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
    monthly_recoveries: "recuperaciones_mensual",
    inventory_report: "reporte_inventario",
    netuno_orders: "ordenes_netuno",
    crew_performance: "rendimiento_cuadrillas",
    crew_inventory: "inventario_cuadrillas",
    crew_stock: "stock_actual_cuadrillas",
    crew_visits: "visitas_cuadrillas",
    crew_orders: "ordenes_cuadrillas",
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
