// app/dashboard/reports/components/ReportTable.tsx
"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import type { ReportType } from "@/types/reportTypes";
import { format } from "date-fns";

interface ReportTableProps {
    reportType: ReportType;
    data: any;
    isLoading: boolean;
    crewId?: string; // Optional crew filter
}

export default function ReportTable({ reportType, data, isLoading, crewId }: ReportTableProps) {
    const router = useRouter();

    // Función para navegar a editar orden
    const handleRowClick = (item: any) => {
        if (['daily_installations', 'daily_repairs', 'monthly_installations', 'monthly_repairs'].includes(reportType) && item._id) {
            router.push(`/dashboard/orders/${item._id}`);
        }
    };

    // Transformación de datos según el tipo de reporte
    const { rows, columns } = useMemo(() => {
        console.log("[DEBUG] ReportTable calculating rows:", { reportType, dataCrews: data?.cuadrillas?.length });
        if (!data) return { rows: [], columns: [] };

        let cols: { key: string; label: string; align?: "start" | "center" | "end" }[] = [];
        let processedRows: any[] = [];

        switch (reportType) {
            case "daily_installations":
            case "daily_repairs":
            case "monthly_installations":
            case "monthly_repairs":
                cols = [
                    { key: "crew", label: "CUADRILLA" },
                    { key: "estado", label: "ESTADO" },
                    { key: "ticket", label: "TICKET" },
                    { key: "subscriberNumber", label: "ABONADO" },
                    { key: "subscriberName", label: "NOMBRE" },
                ];

                // Agregar fecha si es reporte mensual
                if (['monthly_installations', 'monthly_repairs'].includes(reportType)) {
                    cols.push({ key: "date", label: "FECHA" });
                }

                // Agrupar por cuadrilla - filtrar por crewId si está seleccionado
                const dailyCuadrillas = crewId
                    ? (data.cuadrillas || []).filter((crew: any) => crew.crewId === crewId)
                    : (data.cuadrillas || []);

                dailyCuadrillas.forEach((crew: any) => {
                    // Agregar completadas
                    crew.completadas.forEach((order: any) => {
                        processedRows.push({
                            key: `${crew.crewId}-completada-${order._id}`,
                            _id: order._id, // Para navegación
                            crew: crew.crewName,
                            estado: "Completada",
                            ticket: order.ticket || "N/A",
                            subscriberNumber: order.subscriberNumber,
                            subscriberName: order.subscriberName,
                            date: order.completionDate ? format(new Date(order.completionDate), 'dd/MM/yyyy') : '-'
                        });
                    });

                    // Agregar no completadas
                    crew.noCompletadas.forEach((order: any) => {
                        processedRows.push({
                            key: `${crew.crewId}-pendiente-${order._id}`,
                            _id: order._id, // Para navegación
                            crew: crew.crewName,
                            estado: "Pendiente",
                            ticket: order.ticket || "N/A",
                            subscriberNumber: order.subscriberNumber,
                            subscriberName: order.subscriberName,
                            date: order.assignmentDate ? format(new Date(order.assignmentDate), 'dd/MM/yyyy') : '-'
                        });
                    });
                });
                break;



            case "inventory_report":
                cols = [
                    { key: "codigo", label: "CÓDIGO" },
                    { key: "descripcion", label: "DESCRIPCIÓN" },
                    { key: "fecha", label: "FECHA" },
                    { key: "cuadrilla", label: "CUADRILLA" },
                    { key: "cantidad", label: "CANTIDAD", align: "end" },
                    { key: "tipo", label: "TIPO MOVIMIENTO" },
                ];

                // Transform warehouse movements into flat rows
                const entradasRows = (data.entradasNetuno || []).map((item: any, idx: number) => ({
                    key: `entrada-${item._id || idx}`,
                    codigo: item.itemCode,
                    descripcion: item.itemDescription,
                    fecha: format(new Date(item.date), 'dd/MM/yyyy HH:mm'),
                    cuadrilla: "-",
                    cantidad: item.quantity,
                    tipo: "Entrada Netuno",
                }));

                const salidasRows = (data.salidasCuadrillas || []).map((item: any, idx: number) => ({
                    key: `salida-${item._id || idx}`,
                    codigo: item.itemCode,
                    descripcion: item.itemDescription,
                    fecha: format(new Date(item.date), 'dd/MM/yyyy HH:mm'),
                    cuadrilla: item.crewName || "N/A",
                    cantidad: item.quantity,
                    tipo: "Salida Cuadrilla",
                }));

                const devolucionesRows = (data.devolucionesInventario || []).map((item: any, idx: number) => ({
                    key: `devolucion-${item._id || idx}`,
                    codigo: item.itemCode,
                    descripcion: item.itemDescription,
                    fecha: format(new Date(item.date), 'dd/MM/yyyy HH:mm'),
                    cuadrilla: item.crewName || "N/A",
                    cantidad: item.quantity,
                    tipo: "Devolución",
                }));

                processedRows = [...entradasRows, ...salidasRows, ...devolucionesRows];
                break;

            case "netuno_orders":
                cols = [
                    { key: "subscriberNumber", label: "ABONADO" },
                    { key: "subscriberName", label: "NOMBRE" },
                    { key: "type", label: "TIPO" },
                    { key: "node", label: "NODO" },
                    { key: "services", label: "SERVICIOS" },
                ];

                processedRows = (data.pendientes || []).map((item: any, idx: number) => ({
                    key: item._id || idx,
                    subscriberNumber: item.subscriberNumber,
                    subscriberName: item.subscriberName,
                    type: item.type,
                    node: item.node,
                    services: item.servicesToInstall?.join(", ") || "-"
                }));
                break;

            case "crew_performance":
                cols = [
                    { key: "crewName", label: "CUADRILLA" },
                    { key: "totalOrders", label: "TOTAL", align: "end" },
                    { key: "instalaciones", label: "INSTALACIONES", align: "end" },
                    { key: "averias", label: "AVERÍAS", align: "end" },
                    { key: "tiempoPromedioDias", label: "TIEMPO PROM.", align: "end" },
                ];

                processedRows = (data || []).map((item: any, idx: number) => ({
                    key: idx,
                    ...item,
                    tiempoPromedioDias: `${item.tiempoPromedioDias} días`
                }));
                break;

            case "crew_inventory":
                cols = [
                    { key: "crewName", label: "CUADRILLA" },
                    { key: "code", label: "CÓDIGO" },
                    { key: "description", label: "DESCRIPCIÓN" },
                    { key: "quantity", label: "CANTIDAD", align: "end" },
                ];

                (data || []).forEach((crew: any) => {
                    (crew.inventory || []).forEach((item: any, idx: number) => {
                        processedRows.push({
                            key: `${crew.crewId}-${idx}`,
                            crewName: crew.crewName,
                            code: item.code,
                            description: item.description,
                            quantity: item.quantity
                        });
                    });
                });
                break;

            case "crew_visits":
                cols = [
                    { key: "crewName", label: "CUADRILLA" },
                    { key: "totalVisits", label: "TOTAL VISITAS", align: "end" },
                    { key: "instalaciones", label: "INSTALACIONES", align: "end" },
                    { key: "averias", label: "AVERÍAS", align: "end" },
                    { key: "recuperaciones", label: "RECUPERACIONES", align: "end" },
                    { key: "otros", label: "OTROS", align: "end" },
                ];

                // Ensure data is an array
                const crewVisitsData = Array.isArray(data) ? data : [];
                processedRows = crewVisitsData.map((item: any, idx: number) => ({
                    key: idx,
                    crewName: item.crewName,
                    totalVisits: item.totalVisits,
                    instalaciones: item.instalaciones,
                    averias: item.averias,
                    recuperaciones: item.recuperaciones,
                    otros: item.otros
                }));
                break;
        }

        return { rows: processedRows, columns: cols };
    }, [data, reportType, crewId]);

    const renderCell = (item: any, columnKey: React.Key) => {
        const value = item[columnKey as string];

        switch (columnKey) {
            case "status":
                return (
                    <Chip
                        size="sm"
                        variant="flat"
                        color={value === "completed" ? "success" : value === "assigned" ? "warning" : "default"}
                        className="capitalize"
                    >
                        {value === "completed" ? "Finalizada" : value === "in_progress" ? "En Proceso" : value === "assigned" ? "Asignada" : value}
                    </Chip>
                );
            case "type":
                return (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${value === 'instalacion' ? 'bg-blue-100 text-blue-700' : value === 'averia' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                        {value === 'instalacion' ? 'Instalación' : 'Avería'}
                    </span>
                );
            case "tipo":
                const tipoColors: any = {
                    "Entrada Netuno": "bg-green-100 text-green-700",
                    "Salida Cuadrilla": "bg-orange-100 text-orange-700",
                    "Devolución": "bg-blue-100 text-blue-700"
                };
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${tipoColors[value] || 'bg-gray-100'}`}>
                        {value}
                    </span>
                );
            case "category":
                const catColors: any = {
                    "Instalaciones": "bg-blue-100 text-blue-700",
                    "Averías": "bg-red-100 text-red-700",
                    "Averiado": "bg-orange-100 text-orange-700",
                    "Recuperado": "bg-green-100 text-green-700"
                };
                return (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${catColors[value] || 'bg-gray-100'}`}>
                        {value}
                    </span>
                );
            default:
                return value;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="text-center py-12 text-[#bcabae]">
                <i className="fa-solid fa-inbox text-5xl mb-4 opacity-50"></i>
                <p>No hay datos para mostrar con los filtros seleccionados.</p>
            </div>
        );
    }

    return (
        <Table
            aria-label="Tabla de Reportes"
            classNames={{
                wrapper: "bg-white shadow-none border border-[#bcabae]/10",
                th: "bg-gray-50 text-[#bcabae] font-semibold uppercase text-xs",
                td: "text-[#0f0f0f] text-sm py-4",
            }}
        >
            <TableHeader columns={columns}>
                {(column) => (
                    <TableColumn key={column.key} align={column.align || "start"}>
                        {column.label}
                    </TableColumn>
                )}
            </TableHeader>
            <TableBody items={rows}>
                {(item) => (
                    <TableRow
                        key={item.key}
                        onClick={() => handleRowClick(item)}
                        className={['daily_installations', 'daily_repairs', 'monthly_installations', 'monthly_repairs'].includes(reportType) ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
                    >
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
