"use client";

import React, { useState, useRef } from 'react';
import { Card } from "@heroui/card";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import { OrderEditData } from '@/components/orders/OrderEditForm';
import { OrderCompletionCertificate } from '@/components/orders/OrderCompletionCertificate';
import { transformOrderToEditData } from '@/lib/orderUtils';

export const MassCertificateGenerator = () => {
    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");

    // Container for rendering certificates off-screen
    const printContainerRef = useRef<HTMLDivElement>(null);
    const [currentOrder, setCurrentOrder] = useState<OrderEditData | null>(null);

    const generatePDF = async () => {
        if (!startDate || !endDate) return alert("Selecciona un rango de fechas");

        try {
            setIsGenerating(true);
            setProgress(0);
            setStatusText("Buscando órdenes completadas...");

            // 1. Fetch Orders
            const response = await axios.get('/api/web/orders', {
                params: {
                    status: 'completed',
                    startDate,
                    endDate
                }
            });

            const orders = response.data;
            if (!orders || orders.length === 0) {
                alert("No se encontraron órdenes completadas en este rango.");
                setIsGenerating(false);
                return;
            }

            // Sort orders by date (Oldest first)
            orders.sort((a: any, b: any) => {
                const dateA = new Date(a.updatedAt || a.createdAt).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt).getTime();
                return dateA - dateB;
            });

            setStatusText(`Procesando ${orders.length} órdenes...`);

            // Initialize PDF (A4 Portrait)
            // A4 size: 210mm x 297mm
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 10;
            const contentWidth = pageWidth - (margin * 2);

            // We want 3 images per page.
            // Available height = 297 - (margin * 2) = 277mm
            // Height per image = 277 / 3 ≈ 92mm
            const imgHeight = 90; // Slightly less for spacing
            const imgWidth = contentWidth; // Full width

            let currentY = margin;
            let itemsOnPage = 0;

            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                setStatusText(`Generando certificado ${i + 1} de ${orders.length}...`);
                setProgress(((i + 1) / orders.length) * 100);

                // Transform data
                const orderData = transformOrderToEditData(order);
                setCurrentOrder(orderData);

                // Wait for render
                await new Promise(resolve => setTimeout(resolve, 100));

                if (!printContainerRef.current) continue;

                // Capture
                const canvas = await html2canvas(printContainerRef.current, {
                    scale: 2, // Higher quality
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/png');

                // Add to PDF
                if (itemsOnPage === 3) {
                    pdf.addPage();
                    currentY = margin;
                    itemsOnPage = 0;
                }

                pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);

                // Draw a light border around the certificate if desired, or just spacing
                // pdf.rect(margin, currentY, imgWidth, imgHeight);

                currentY += imgHeight + 2; // +2mm spacing
                itemsOnPage++;
            }

            setStatusText("Guardando PDF...");
            pdf.save(`certificados_completados_${startDate}_${endDate}.pdf`);
            setStatusText("¡Completado!");

        } catch (error) {
            console.error("Error generating mass PDF:", error);
            alert("Ocurrió un error al generar el PDF.");
        } finally {
            setIsGenerating(false);
            setCurrentOrder(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary"
                    />
                </div>
                <Button
                    color="primary"
                    isLoading={isGenerating}
                    onPress={generatePDF}
                    className="w-full md:w-auto"
                >
                    {isGenerating ? "Generando..." : "Descargar Certificados (PDF)"}
                </Button>
            </div>

            {isGenerating && (
                <div className="space-y-2 animate-in fade-in">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{statusText}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} color="primary" size="sm" />
                </div>
            )}

            {/* Hidden Container for Rendering */}
            <div className="absolute top-0 left-[-9999px] w-[800px]" ref={printContainerRef}>
                {currentOrder && (
                    <OrderCompletionCertificate data={currentOrder} />
                )}
            </div>
        </div>
    );
};
