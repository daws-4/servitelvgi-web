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

            // Sort orders by technician, then by date (Most recent first within each technician)
            orders.sort((a: any, b: any) => {
                // Get technician name (from assignedTo.leader or crew number)
                const getTechName = (order: any) => {
                    if (order.assignedTo?.leader?.name) {
                        return `${order.assignedTo.leader.name} ${order.assignedTo.leader.surname || ''}`.trim();
                    }
                    return order.assignedTo?.number ? `Cuadrilla ${order.assignedTo.number}` : 'Sin asignar';
                };

                const techA = getTechName(a);
                const techB = getTechName(b);

                // First compare by technician name
                if (techA !== techB) {
                    return techA.localeCompare(techB);
                }

                // If same technician, sort by date (most recent first)
                const dateA = new Date(a.updatedAt || a.createdAt).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt).getTime();
                return dateB - dateA; // Descending order (most recent first)
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
            let lastTechnician = ''; // Track current technician

            // Helper function to get technician name
            const getTechName = (order: any) => {
                if (order.assignedTo?.leader?.name) {
                    return `${order.assignedTo.leader.name} ${order.assignedTo.leader.surname || ''}`.trim();
                }
                return order.assignedTo?.number ? `Cuadrilla ${order.assignedTo.number}` : 'Sin asignar';
            };

            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                setStatusText(`Generando certificado ${i + 1} de ${orders.length}...`);
                setProgress(((i + 1) / orders.length) * 100);

                // Check if technician changed
                const currentTechnician = getTechName(order);
                const technicianChanged = lastTechnician !== '' && currentTechnician !== lastTechnician;

                // If technician changed and there's content on current page, start new page
                if (technicianChanged && itemsOnPage > 0) {
                    pdf.addPage();
                    currentY = margin;
                    itemsOnPage = 0;
                }

                lastTechnician = currentTechnician;

                // Transform data
                const orderData = transformOrderToEditData(order);
                setCurrentOrder(orderData);

                // Wait for render
                await new Promise(resolve => setTimeout(resolve, 100));

                if (!printContainerRef.current) continue;

                // Capture
                const canvas = await html2canvas(printContainerRef.current, {
                    scale: 1.5, // Reduced from 2 for compression (good enough for A4)
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                // Use JPEG instead of PNG for massive compression
                // Quality 0.75 is usually indistinguishable for documents but 5x smaller
                const imgData = canvas.toDataURL('image/jpeg', 0.75);

                // Add to PDF - check if page is full
                if (itemsOnPage === 3) {
                    pdf.addPage();
                    currentY = margin;
                    itemsOnPage = 0;
                }

                pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight);

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
