// app/dashboard/reports/components/ExportActions.tsx
"use client";

import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { addToast } from "@heroui/toast";

const toast = {
    success: (message: string) => addToast({ title: message, color: "success" }),
    error: (message: string) => addToast({ title: message, color: "danger" }),
    warning: (message: string) => addToast({ title: message, color: "warning" }),
};
import type { ReportType } from "@/types/reportTypes";
import { exportReportToExcel } from "@/lib/exports/exportToExcel";
import { exportReportToPDF } from "@/lib/exports/exportToPDF";
import { exportReportToWord } from "@/lib/exports/exportToWord";
import { sendReportToN8n } from "@/lib/exports/sendToN8n";
import { CrewVisitsReportCard } from "@/components/reports/CrewVisitsReportCard";

interface ExportActionsProps {
    reportType: ReportType;
    data: any;
    metadata: any;
}

export default function ExportActions({ reportType, data, metadata }: ExportActionsProps) {
    const [isSending, setIsSending] = useState(false);

    // Validar si hay datos para exportar
    const hasData = () => {
        if (!data) return false;
        if (Array.isArray(data)) return data.length > 0;
        if (data.crews) return data.crews.length > 0; // crew_stock report
        if (data.cuadrillas) return data.cuadrillas.length > 0; // Daily/Monthly reports
        if (data.finalizadas) return (data.finalizadas.length + data.asignadas.length) > 0;
        if (data.pendientes) return data.pendientes.length > 0;
        if (data.instalaciones) return true; // Inventario siempre tiene estructura
        return false;
    };

    const isDisabled = !hasData();

    const handleExportExcel = () => {
        try {
            exportReportToExcel(reportType, data, metadata);
            toast.success("Archivo Excel descargado");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar Excel");
        }
    };

    const handleExportPDF = () => {
        try {
            exportReportToPDF(reportType, data, metadata);
            toast.success("Archivo PDF descargado");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar PDF");
        }
    };

    const handleExportWord = async () => {
        try {
            await exportReportToWord(reportType, data, metadata);
            toast.success("Archivo Word descargado");
        } catch (error) {
            console.error(error);
            toast.error("Error al generar Word");
        }
    };

    const handleExportImage = async () => {
        if (reportType !== 'crew_visits') return;

        try {
            // Dynamically import html-to-image
            const { toPng } = await import('html-to-image');

            // Create a temporary container
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            document.body.appendChild(container);

            // Render the component
            const root = createRoot(container);
            root.render(
                <CrewVisitsReportCard
                    data={data}
                    dateRange={{
                        start: metadata.filters.startDate,
                        end: metadata.filters.endDate
                    }}
                />
            );

            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 500));

            const element = container.firstChild as HTMLElement;
            if (element) {
                const dataUrl = await toPng(element, {
                    quality: 0.95,
                    backgroundColor: '#ffffff'
                });

                // Download the image
                const link = document.createElement('a');
                link.download = (() => {
                    const crewNumber = metadata.filters.crewId ? 'cuadrilla_especifica' : 'todas';
                    const startDate = new Date(metadata.filters.startDate);
                    const endDate = new Date(metadata.filters.endDate);
                    const monthStr = startDate.getMonth() === endDate.getMonth()
                        ? startDate.toLocaleDateString('es-ES', { month: 'short' })
                        : `${startDate.toLocaleDateString('es-ES', { month: 'short' })}-${endDate.toLocaleDateString('es-ES', { month: 'short' })}`;
                    const timestamp = new Date().getTime();
                    return `visitas_cuadrilla_${crewNumber}_${monthStr}_${timestamp}.png`;
                })();
                link.href = dataUrl;
                link.click();

                toast.success("Imagen descargada exitosamente");
            }

            // Cleanup
            root.unmount();
            document.body.removeChild(container);
        } catch (error) {
            console.error(error);
            toast.error("Error al generar imagen");
        }
    };

    const handleSendToN8n = async () => {
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;

        // Check if URL is configured (even if we check in backend, good to check in UI too)
        // Note: client validation might be limited if env var is not exposed properly, but we use the helper

        setIsSending(true);
        try {
            const result = await sendReportToN8n(reportType, data, metadata);
            if (result.success) {
                toast.success(`Enviado a n8n: ${result.recordsProcessed} registros`);
            } else {
                toast.error("Error al enviar a n8n: " + (result.errors?.[0] || result.message));
            }
        } catch (error) {
            // Check if error is about missing configuration
            if ((error as any).message.includes("N8N_WEBHOOK_URL")) {
                toast.warning("Webhook n8n no configurado");
            } else {
                toast.error("Falló el envío a n8n");
            }
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                {/* Excel export - available for all reports */}
                <Tooltip content="Exportar a Excel">
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={handleExportExcel}
                        isDisabled={isDisabled}
                    >
                        <i className="fa-solid fa-file-excel text-green-600 text-lg"></i>
                    </Button>
                </Tooltip>

                {/* PDF - oculto para daily/monthly reports */}
                {!['daily_installations', 'daily_repairs', 'monthly_installations', 'monthly_repairs'].includes(reportType) && (
                    <Tooltip content="Exportar a PDF">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={handleExportPDF}
                            isDisabled={isDisabled}
                        >
                            <i className="fa-solid fa-file-pdf text-red-600 text-lg"></i>
                        </Button>
                    </Tooltip>
                )}

                {/* Word - oculto para daily/monthly reports y crew_visits */}
                {!['daily_installations', 'daily_repairs', 'monthly_installations', 'monthly_repairs', 'crew_visits'].includes(reportType) && (
                    <Tooltip content="Exportar a Word">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={handleExportWord}
                            isDisabled={isDisabled}
                        >
                            <i className="fa-solid fa-file-word text-blue-600 text-lg"></i>
                        </Button>
                    </Tooltip>
                )}

                {reportType === 'crew_visits' && (
                    <Tooltip content="Exportar como Imagen">
                        <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={handleExportImage}
                            isDisabled={isDisabled}
                        >
                            <i className="fa-solid fa-image text-purple-600 text-lg"></i>
                        </Button>
                    </Tooltip>
                )}
            </div>

            <div className="w-px h-6 bg-[#bcabae]/30 mx-2"></div>

            {/* n8n - oculto para daily reports y crew_visits */}
            {!['daily_installations', 'daily_repairs', 'crew_visits'].includes(reportType) && (
                <Button
                    size="sm"
                    color="primary"
                    variant="solid"
                    onPress={handleSendToN8n}
                    isDisabled={isDisabled}
                    isLoading={isSending}
                    className="bg-[#3e78b2]"
                    startContent={!isSending && <i className="fa-solid fa-paper-plane"></i>}
                >
                    Enviar a n8n
                </Button>
            )}
        </div>
    );
}
