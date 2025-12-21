// app/dashboard/reports/components/ReportHistoryDrawer.tsx
"use client";

import React, { useEffect, useState } from "react";
// import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer"; 
// Note: HeroUI components might vary in names. Adjusting to standard Modal/Drawer usage if needed
// Or using a custom sidebar implementation if Drawer isn't available in current version
// Assuming a custom implementation based on the template logic or HeroUI if available. 
// Given the user instructions, I should use what's available. 
// Let's assume a basic sliding pane implementation using Tailwind and state if Drawer component is tricky
// But wait, the plan mentioned Drawers. I'll use a fixed div with transition styles similar to the sidebar in dashboard.html

import { Button } from "@heroui/button";
import { Listbox, ListboxItem } from "@heroui/listbox";
import { format } from "date-fns";
import { Chip } from "@heroui/chip";
import { Skeleton } from "@heroui/skeleton";
import { addToast } from "@heroui/toast";

const toast = {
    success: (message: string) => addToast({ title: message, color: "success" }),
    error: (message: string) => addToast({ title: message, color: "danger" }),
};

interface ReportHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectReport: (report: any) => void;
}

export default function ReportHistoryDrawer({ isOpen, onClose, onSelectReport }: ReportHistoryDrawerProps) {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);

    // Cargar reportes al abrir
    useEffect(() => {
        if (isOpen) {
            loadReports();
        }
    }, [isOpen]);

    const loadReports = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/web/reportes/history?page=${page}&limit=20`);
            const json = await res.json();
            if (json.data) {
                setReports(json.data); // Replace for now, could append for infinite scroll
            }
        } catch (err) {
            console.error(err);
            toast.error("Error cargando historial");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = async (id: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/web/reportes/history/${id}`);
            const json = await res.json();
            if (json.data) {
                onSelectReport(json); // Pass full generated report object (includes data, metadata, filters)
                toast.success("Reporte cargado desde historial");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error al cargar detalle del reporte");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("¿Eliminar este reporte permanentemente?")) return;

        try {
            const res = await fetch(`/api/web/reportes/history/${id}`, { method: "DELETE" });
            if (res.ok) {
                setReports(reports.filter((r) => r._id !== id));
                toast.success("Reporte eliminado");
            }
        } catch (err) {
            toast.error("Error eliminando reporte");
        }
    };

    const getReportLabel = (type: string) => {
        const labels: any = {
            daily_installations: "Diario - Inst.",
            daily_repairs: "Diario - Aver.",
            monthly_installations: "Mensual - Inst.",
            monthly_repairs: "Mensual - Aver.",
            inventory_report: "Inventario",
            netuno_orders: "Netuno",
            crew_performance: "Rendimiento",
        };
        return labels[type] || type;
    };

    // Drawer CSS classes based on isOpen
    const drawerClasses = `fixed inset-y-0 right-0 z-50 w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"
        }`;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                ></div>
            )}

            {/* Drawer Panel */}
            <div className={drawerClasses}>
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-[#bcabae]/20 flex justify-between items-center bg-gray-50">
                        <div>
                            <h2 className="text-lg font-bold text-[#0f0f0f]">Historial</h2>
                            <p className="text-xs text-[#bcabae]">Reportes generados recientemente</p>
                        </div>
                        <button onClick={onClose} className="text-[#bcabae] hover:text-red-500 transition-colors">
                            <i className="fa-solid fa-times text-xl"></i>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoading && reports.length === 0 ? (
                            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg w-full" />)
                        ) : reports.length === 0 ? (
                            <div className="text-center py-10 text-[#bcabae]">
                                <i className="fa-regular fa-folder-open text-4xl mb-2"></i>
                                <p>No hay reportes guardados</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reports.map((report) => (
                                    <div
                                        key={report._id}
                                        onClick={() => handleSelect(report._id)}
                                        className="p-3 rounded-lg border border-[#bcabae]/20 hover:border-[#3e78b2] hover:bg-blue-50 cursor-pointer transition-all group relative bg-white"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <Chip size="sm" variant="flat" className="bg-[#deefb7] text-[#004ba8] font-bold capitalize">
                                                {getReportLabel(report.reportType)}
                                            </Chip>
                                            <button
                                                onClick={(e) => handleDelete(e, report._id)}
                                                className="text-[#bcabae] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            >
                                                <i className="fa-solid fa-trash-can"></i>
                                            </button>
                                        </div>

                                        <div className="text-sm text-[#0f0f0f] font-medium mb-1">
                                            {report.filters?.startDate}
                                            {report.filters?.endDate && report.filters.endDate !== report.filters.startDate && ` - ${report.filters.endDate}`}
                                        </div>

                                        <div className="flex justify-between items-center text-xs text-[#bcabae]">
                                            <span>{report.metadata?.totalRecords || 0} registros</span>
                                            <span>{format(new Date(report.createdAt), "dd/MM HH:mm")}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-[#bcabae]/20 bg-gray-50 flex justify-center">
                        <Button size="sm" variant="light" onPress={loadReports} isLoading={isLoading}>
                            <i className="fa-solid fa-rotate-right mr-2"></i> Actualizar
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
