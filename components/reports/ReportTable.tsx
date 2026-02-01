// app/dashboard/reports/components/ReportTable.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Pagination } from "@heroui/pagination";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Button } from "@heroui/button";
import type { ReportType } from "@/types/reportTypes";
import { format } from "date-fns";
import CrewBobbinModal from "../crews/CrewBobbinModal";
// import CrewEquipmentModal from "../crews/CrewEquipmentModal"; // Comentado hasta que exista

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
        if (['daily_installations', 'daily_repairs', 'monthly_installations', 'monthly_repairs', 'monthly_recoveries'].includes(reportType) && item._id) {
            router.push(`/dashboard/orders/${item._id}`);
        }
    };

    // Modal para detalles de inventario
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [selectedItemDetails, setSelectedItemDetails] = useState<{ title: string; details: any[] } | null>(null);

    const handleViewDetails = (item: any) => {
        if (item.details && item.details.length > 0) {
            setSelectedItemDetails({
                title: `${item.description} - ${item.crewName}`,
                details: item.details
            });
            onOpen();
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
            case "monthly_recoveries":
                cols = [
                    { key: "crew", label: "CUADRILLA" },
                    { key: "estado", label: "ESTADO" },
                    { key: "ticket", label: "TICKET" },
                    { key: "subscriberNumber", label: "ABONADO" },
                    { key: "subscriberName", label: "NOMBRE" },
                ];

                // Agregar fecha si es reporte mensual
                if (['monthly_installations', 'monthly_repairs', 'monthly_recoveries'].includes(reportType)) {
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
                    { key: "crew", label: "CUADRILLA" },
                    { key: "date", label: "FECHA" },
                ];

                processedRows = (data.pendientes || []).map((item: any, idx: number) => ({
                    key: item._id || idx,
                    subscriberNumber: item.subscriberNumber,
                    subscriberName: item.subscriberName,
                    type: item.type,
                    node: item.node,
                    services: item.servicesToInstall?.join(", ") || "-",
                    crew: (item.assignedTo?.number !== undefined && item.assignedTo?.number !== null) ? `Cuadrilla ${item.assignedTo.number}` : "S/A",
                    date: item.completionDate ? format(new Date(item.completionDate), 'dd/MM/yyyy') : '-'
                }));
                break;

            case "crew_performance":
                cols = [
                    { key: "crewName", label: "CUADRILLA" },
                    { key: "ticket", label: "TICKET" },
                    { key: "subscriber", label: "ABONADO" },
                    { key: "createdAt", label: "CREADO" },
                    { key: "updatedAt", label: "COMPLETADO" },
                    { key: "duration", label: "TIEMPO REAL (U-C)", align: "end" },
                ];

                processedRows = (data?.orders || []).map((item: any, idx: number) => ({
                    key: idx,
                    crewName: item.crewName,
                    ticket: item.ticket,
                    subscriber: item.subscriber,
                    createdAt: item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm') : '-',
                    updatedAt: item.updatedAt ? format(new Date(item.updatedAt), 'dd/MM/yyyy HH:mm') : '-',
                    duration: item.duration
                }));
                break;

            case "crew_inventory":
                cols = [
                    { key: "date", label: "FECHA" },
                    { key: "crewName", label: "CUADRILLA" },
                    { key: "type", label: "TIPO" },
                    { key: "code", label: "CÓDIGO" },
                    { key: "description", label: "DESCRIPCIÓN" },
                    { key: "quantity", label: "CANTIDAD", align: "end" },
                    { key: "detail", label: "DETALLE" },
                ];

                processedRows = (data || []).map((item: any, idx: number) => ({
                    key: idx,
                    date: item.date ? format(new Date(item.date), 'dd/MM/yyyy HH:mm') : '-',
                    crewName: item.crewName,
                    type: item.type === 'assignment' ? 'Asignación' : item.type === 'return' ? 'Devolución' : 'Gasto en Orden',
                    code: item.itemCode,
                    description: item.itemDescription,
                    quantity: item.quantity, // quantityChange from backend
                    detail: item.orderTicket ? `Orden ${item.orderTicket}` : (item.reason || '-')
                }));
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

            case "crew_stock":
                cols = [
                    { key: "crewName", label: "CUADRILLA" },
                    { key: "code", label: "CÓDIGO" },
                    { key: "description", label: "DESCRIPCIÓN" },
                    { key: "startQty", label: "INICIAL", align: "end" },
                    { key: "endQty", label: "FINAL", align: "end" },
                    { key: "diff", label: "DIFERENCIA", align: "end" },
                    { key: "actions", label: "DETALLES", align: "center" },
                ];

                // Flatten the nested structure
                const stockRows: any[] = [];
                (data || []).forEach((crew: any, cIdx: number) => {
                    (crew.inventory || []).forEach((inv: any, iIdx: number) => {
                        stockRows.push({
                            key: `${cIdx}-${iIdx}`,
                            crewName: crew.crewName,
                            crewId: crew.crewId,
                            code: inv.code,
                            description: inv.description,
                            startQty: inv.startQty,
                            endQty: inv.endQty,
                            diff: inv.diff,
                            itemId: inv.itemId, // Needed for modals
                            details: inv.details || [],
                            hasDetails: inv.hasDetails
                        });
                    });
                });
                processedRows = stockRows;
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
            case "diff":
                const diffVal = Number(value);
                if (diffVal === 0) return <span className="text-gray-400">0</span>;
                return (
                    <span className={`font-medium ${diffVal > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {diffVal > 0 ? `+${diffVal}` : diffVal}
                    </span>
                );
            case "actions":
                if (item.hasDetails) {
                    // Check type of details to decide button
                    // We can check item.itemId or details content
                    const isBobbin = item.details.some((d: any) => d.type === 'bobbin');
                    const isEquipment = item.details.some((d: any) => d.type === 'instance');

                    return (
                        <div className="flex gap-2 justify-center">
                            {isBobbin && (
                                <Button
                                    size="sm"
                                    color="warning"
                                    variant="flat"
                                    onPress={() => handleOpenBobbinModal(item)}
                                    className="h-8 w-8 min-w-0 p-0 rounded-full"
                                    title="Ver Bobinas"
                                >
                                    <i className="fa-solid fa-ring text-orange-600"></i>
                                </Button>
                            )}
                            {/* Generic Details Fallback or Equipment if we had specific modal ready and imported */}
                            {!isBobbin && hasGenericModal(item) && (
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="primary"
                                    onPress={() => handleViewDetails(item)}
                                    className="h-8 min-w-[100px]"
                                >
                                    Ver Detalles
                                </Button>
                            )}
                        </div>
                    );
                }
                return <span className="text-gray-400">-</span>;
            default:
                return value;
        }
    };

    // Auxiliary function to determine if generic modal should be used
    const hasGenericModal = (item: any) => {
        // If not bobbin, use generic for now (until Equipment Modal is fully integrated here)
        return true;
    };

    // Modal State for Bobbin
    const [bobbinModalOpen, setBobbinModalOpen] = useState(false);
    const [selectedBobbinItem, setSelectedBobbinItem] = useState<{ crewId: string, itemId: string, code: string, desc: string, crewName: string } | null>(null);

    const handleOpenBobbinModal = (item: any) => {
        setSelectedBobbinItem({
            crewId: item.crewId,
            itemId: item.itemId,
            code: item.code,
            desc: item.description,
            crewName: item.crewName
        });
        setBobbinModalOpen(true);
    };

    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    // Reset page on data change
    useEffect(() => {
        setPage(1);
    }, [data, reportType, crewId]);

    const pages = Math.ceil(rows.length / rowsPerPage);

    const items = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return rows.slice(start, end);
    }, [page, rows]);

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
        <>
            <div className="space-y-4">
                {/* Netuno Summary */}
                {reportType === 'netuno_orders' && data?.pendientes && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex flex-wrap gap-6 items-center shadow-sm">
                        <div className="border-r border-orange-200 pr-6">
                            <span className="text-orange-800 font-semibold block text-xs uppercase tracking-wide">Total Pendientes</span>
                            <span className="text-3xl font-bold text-orange-900">{data.pendientes.length}</span>
                        </div>
                        <div className="flex gap-6">
                            <div>
                                <span className="text-blue-800 font-semibold block text-xs uppercase tracking-wide">Instalaciones</span>
                                <span className="text-xl font-bold text-blue-900">{data.totales?.instalaciones || 0}</span>
                            </div>
                            <div>
                                <span className="text-red-800 font-semibold block text-xs uppercase tracking-wide">Averías</span>
                                <span className="text-xl font-bold text-red-900">{data.totales?.averias || 0}</span>
                            </div>
                        </div>
                        <div className="ml-auto text-xs text-orange-700 italic">
                            * Órdenes completadas pendientes por enviar a Netuno
                        </div>
                    </div>
                )}

                {/* Crew Performance Summary */}
                {reportType === 'crew_performance' && data?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {(data.summary || []).map((crewStats: any, idx: number) => (
                            <div key={idx} className="bg-white border rounded-lg p-4 shadow-sm">
                                <h3 className="text-lg font-bold text-gray-800 mb-2">{crewStats.crewName}</h3>
                                <div className="flex flex-col gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Asignadas:</span>
                                        <span className="font-semibold">{crewStats.assigned}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Procesadas (Real):</span>
                                        <span className="font-semibold text-blue-600">{crewStats.validCompleted}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Tiempo Promedio:</span>
                                        <span className="font-semibold text-green-600">{crewStats.avgTime}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="w-full overflow-x-auto rounded-lg border border-[#bcabae]/10 bg-white shadow-sm">
                    <Table
                        aria-label="Tabla de Reportes"
                        shadow="none"
                        radius="none"
                        classNames={{
                            wrapper: "p-0 bg-transparent shadow-none", // Remove wrapper internal padding/shadow/bg
                            table: "min-w-[1200px]", // Force minimum width to trigger scroll
                            th: "bg-gray-50 text-[#bcabae] font-semibold uppercase text-xs",
                            td: "text-[#0f0f0f] text-sm py-4",
                        }}
                        bottomContent={
                            pages > 1 ? (
                                <div className="flex w-full justify-center py-4 border-t border-gray-100">
                                    <Pagination
                                        isCompact
                                        showControls
                                        showShadow
                                        color="primary"
                                        page={page}
                                        total={pages}
                                        onChange={(page) => setPage(page)}
                                    />
                                </div>
                            ) : null
                        }
                    >
                        <TableHeader columns={columns}>
                            {(column) => (
                                <TableColumn key={column.key} align={column.align || "start"}>
                                    {column.label}
                                </TableColumn>
                            )}
                        </TableHeader>
                        <TableBody items={items}>
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
                </div>
            </div>

            {/* Modal de Detalles Genérico */}
            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                scrollBehavior="inside"
                size="lg"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {selectedItemDetails?.title}
                            </ModalHeader>
                            <ModalBody>
                                <Table aria-label="Detalles de items">
                                    <TableHeader>
                                        <TableColumn>TIPO</TableColumn>
                                        <TableColumn>IDENTIFICADOR</TableColumn>
                                        <TableColumn align="end">VALOR</TableColumn>
                                    </TableHeader>
                                    <TableBody items={selectedItemDetails?.details || []}>
                                        {(detail: any) => (
                                            <TableRow key={`${detail.label}-${detail.value}`}>
                                                <TableCell>
                                                    <Chip size="sm" variant="flat" color={detail.type === 'bobbin' ? "warning" : "secondary"}>
                                                        {detail.type === 'bobbin' ? "Bobina" : "Serial"}
                                                    </Chip>
                                                </TableCell>
                                                <TableCell>{detail.label === 'Serial' ? detail.value : detail.label}</TableCell>
                                                <TableCell>
                                                    {detail.type === 'bobbin' ? `${detail.value} mts` : '-'}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal Específico para Bobinas (Solo Lectura) */}
            {selectedBobbinItem && (
                <CrewBobbinModal
                    isOpen={bobbinModalOpen}
                    onClose={() => setBobbinModalOpen(false)}
                    crewId={selectedBobbinItem.crewId}
                    crewNumber={parseInt(selectedBobbinItem.crewName?.replace(/\D/g, '') || "0")} // Extract number attempt
                    materialId={selectedBobbinItem.itemId}
                    materialCode={selectedBobbinItem.code}
                    materialDescription={selectedBobbinItem.desc}
                    onSuccess={() => { }} // No action needed for read only
                    readOnly={true}
                />
            )}
        </>
    );
}
