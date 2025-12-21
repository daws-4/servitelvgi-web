// app/dashboard/reports/components/ReportTable.tsx
"use client";

import React, { useMemo } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import type { ReportType } from "@/types/reportTypes";
import { format } from "date-fns";

interface ReportTableProps {
    reportType: ReportType;
    data: any;
    isLoading: boolean;
}

export default function ReportTable({ reportType, data, isLoading }: ReportTableProps) {

    // Transformación de datos según el tipo de reporte
    const { rows, columns } = useMemo(() => {
        if (!data) return { rows: [], columns: [] };

        let cols: { key: string; label: string; align?: "start" | "center" | "end" }[] = [];
        let processedRows: any[] = [];

        switch (reportType) {
            case "daily_installations":
            case "daily_repairs":
            case "monthly_installations":
            case "monthly_repairs":
                cols = [
                    { key: "subscriberNumber", label: "ABONADO" },
                    { key: "subscriberName", label: "NOMBRE" },
                    { key: "address", label: "DIRECCIÓN" },
                    { key: "status", label: "ESTADO" },
                    { key: "assignedTo", label: "CUADRILLA" },
                    { key: "date", label: "FECHA" },
                ];

                const allOrders = [...(data.finalizadas || []), ...(data.asignadas || [])];
                processedRows = allOrders.map((item: any, idx) => ({
                    key: item._id || idx,
                    subscriberNumber: item.subscriberNumber,
                    subscriberName: item.subscriberName,
                    address: item.address ? (item.address.length > 40 ? item.address.substring(0, 40) + "..." : item.address) : "-",
                    status: item.status,
                    assignedTo: item.assignedTo?.name || "Sin asignar",
                    date: item.completionDate || item.assignmentDate ? format(new Date(item.completionDate || item.assignmentDate), "dd/MM/yyyy") : "-",
                    type: item.type
                }));
                break;

            case "inventory_report":
                cols = [
                    { key: "code", label: "CÓDIGO" },
                    { key: "description", label: "DESCRIPCIÓN" },
                    { key: "category", label: "CATEGORÍA" },
                    { key: "quantity", label: "CANTIDAD", align: "end" },
                ];

                const categories = [
                    { items: data.instalaciones, cat: "Instalaciones" },
                    { items: data.averias, cat: "Averías" },
                    { items: data.materialAveriado, cat: "Averiado" },
                    { items: data.materialRecuperado, cat: "Recuperado" },
                ];

                categories.forEach(({ items, cat }) => {
                    (items || []).forEach((item: any, idx: number) => {
                        processedRows.push({
                            key: `${cat}-${item._id || idx}`,
                            code: item.code,
                            description: item.description,
                            category: cat,
                            quantity: item.usado || item.quantityChange || item.quantity || 0,
                        });
                    });
                });
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
        }

        return { rows: processedRows, columns: cols };
    }, [data, reportType]);

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
                    <TableRow key={item.key}>
                        {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
