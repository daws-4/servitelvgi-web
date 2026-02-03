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
import { MassCertificateGenerator } from "@/components/reports/MassCertificateGenerator";
import type { ReportType, ReportFilters as IReportFilters } from "@/types/reportTypes";

export default function ReportsPage() {
    const [filters, setFilters] = useState<IReportFilters | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"metrics" | "certificates">("metrics");

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

    return (
        <div className="min-h-screen pb-8">
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0f0f0f]">Sistema de Reportes</h1>
                        <p className="text-sm text-[#bcabae] mt-1">Generación y exportación de métricas operativas</p>
                    </div>
                </div>

                {/* Tab Selection */}
                <div className="flex space-x-1 rounded-xl bg-gray-100 p-1 w-full md:w-fit">
                    <button
                        onClick={() => setActiveTab("metrics")}
                        className={`w-full md:w-auto px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "metrics"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <i className="fa-solid fa-chart-pie mr-2"></i>
                        Métricas Generales
                    </button>
                    <button
                        onClick={() => setActiveTab("certificates")}
                        className={`w-full md:w-auto px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "certificates"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <i className="fa-solid fa-file-pdf mr-2"></i>
                        Certificados Masivos
                    </button>
                </div>

                {activeTab === "metrics" ? (
                    <>
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
                    </>
                ) : (
                    <Card className="p-6 bg-white shadow-sm border border-[#bcabae]/10 rounded-xl">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Generación de Certificados Masivos</h2>
                            <p className="text-sm text-gray-500">
                                Genera un único archivo PDF que contiene los certificados de finalización
                                de todas las órdenes completadas en el rango de fechas seleccionado.
                            </p>
                            <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 inline-block">
                                <i className="fa-solid fa-info-circle mr-1"></i>
                                El PDF contendrá 3 certificados por página para optimizar la impresión.
                            </div>
                        </div>
                        <MassCertificateGenerator />
                    </Card>
                )}

            </div>
        </div>
    );
}
