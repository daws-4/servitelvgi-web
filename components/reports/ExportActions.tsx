// app/dashboard/reports/components/ExportActions.tsx
"use client";

import React, { useState } from "react";
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
            </div>

            <div className="w-px h-6 bg-[#bcabae]/30 mx-2"></div>

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
        </div>
    );
}
