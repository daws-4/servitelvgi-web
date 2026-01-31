// app/dashboard/reports/page.tsx
"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Card } from "@heroui/card";
import { addToast } from "@heroui/toast";

const toast = {
    success: (message: string) => addToast({ title: message, color: "success" }),
    error: (message: string) => addToast({ title: message, color: "danger" }),
};

import ReportFilters from "../../../components/reports/ReportFilters";
import ReportTable from "../../../components/reports/ReportTable";
import ExportActions from "../../../components/reports/ExportActions";
import ReportHistoryDrawer from "../../../components/reports/ReportHistoryDrawer";
import type { ReportType, ReportFilters as IReportFilters } from "@/types/reportTypes";

export default function ReportsPage() {
    const [filters, setFilters] = useState<IReportFilters | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const handleGenerateReport = async (selectedFilters: IReportFilters) => {
        setIsLoading(true);
        setFilters(selectedFilters); // Set filters immediately so UI updates
        setReportData(null); // Clear previous data while loading

        try {
            const queryParams = new URLSearchParams({
                type: selectedFilters.reportType,
                startDate: selectedFilters.startDate,
                endDate: selectedFilters.endDate,
            });

            if (selectedFilters.crewId) {
                queryParams.append("crewId", selectedFilters.crewId);
            }

            console.log(`[FE DEBUG] Fetching: /api/web/reportes?${queryParams}`);

            const response = await fetch(`/api/web/reportes?${queryParams}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("[FE DEBUG] API Error:", errorData);
                throw new Error(errorData.error || "Error generando reporte");
            }

            const result = await response.json();
            console.log("[FE DEBUG] API Response Data:", result);

            setReportData(result.data);
            setMetadata(result.metadata);

            if (result.metadata?.cached) {
                toast.success("Reporte cargado desde caché (generado previamente)");
            } else {
                toast.success("Reporte generado exitosamente");
            }

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al obtener datos del reporte");
            setReportData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectFromHistory = (fullReport: any) => {
        setReportData(fullReport.data);
        setMetadata(fullReport.metadata);
        setFilters(fullReport.filters);
        setIsHistoryOpen(false);
    };

    return (
        <div className="min-h-screen pb-8">
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f0f0f]">Sistema de Reportes</h1>
                        <p className="text-sm text-[#bcabae] mt-1">Generación y exportación de métricas operativas</p>
                    </div>
                    <Button
                        variant="flat"
                        className="bg-white text-[#3e78b2] border border-[#3e78b2]/30 shadow-sm"
                        onPress={() => setIsHistoryOpen(true)}
                        startContent={<i className="fa-solid fa-clock-rotate-left"></i>}
                    >
                        Historial Generado
                    </Button>
                </div>

                {/* Filters Card */}
                <Card className="p-6 bg-white shadow-sm border border-[#bcabae]/10 rounded-xl">
                    <ReportFilters
                        onGenerate={handleGenerateReport}
                        isLoading={isLoading}
                    />
                </Card>

                {/* Results Section */}
                {(reportData || isLoading) && filters?.reportType && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-end border-b border-[#bcabae]/10 pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-[#0f0f0f] flex items-center gap-2">
                                    <i className="fa-solid fa-table-list text-[#3e78b2]"></i>
                                    Resultados
                                </h2>
                                <div className="text-xs text-[#bcabae] mt-1">
                                    {isLoading ? "Cargando datos..." :
                                        metadata ? `${metadata.totalRecords || 0} registros encontrados • Generado: ${new Date().toLocaleTimeString()}` : ""}
                                </div>
                            </div>

                            {!isLoading && reportData && (
                                <ExportActions
                                    reportType={filters.reportType}
                                    data={reportData}
                                    metadata={metadata}
                                />
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <ReportTable
                                reportType={filters.reportType}
                                data={reportData}
                                isLoading={isLoading}
                                crewId={filters?.crewId}
                            />
                        </div>
                    </div>
                )}

                {/* Drawers/Modals */}
                <ReportHistoryDrawer
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    onSelectReport={handleSelectFromHistory}
                />
            </div>
        </div>
    );
}
