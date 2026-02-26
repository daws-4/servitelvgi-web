"use client";

import React, { useState, useRef, useEffect } from 'react';
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

    // New filter states
    const [ordersPerPage, setOrdersPerPage] = useState(3); // 1, 2, or 3
    const [selectedCrew, setSelectedCrew] = useState("all"); // "all" or crew _id
    const [crews, setCrews] = useState<any[]>([]);

    // Container for rendering certificates off-screen
    const printContainerRef = useRef<HTMLDivElement>(null);
    const [currentOrder, setCurrentOrder] = useState<OrderEditData | null>(null);

    // Fetch crews list on component mount
    useEffect(() => {
        const fetchCrews = async () => {
            try {
                const response = await axios.get('/api/web/crews');
                setCrews(response.data || []);
            } catch (error) {
                console.error("Error fetching crews:", error);
            }
        };
        fetchCrews();
    }, []);

    const generatePDF = async () => {
        if (!startDate || !endDate) return alert("Selecciona un rango de fechas");

        try {
            setIsGenerating(true);
            setProgress(0);
            setStatusText("Buscando órdenes completadas...");

            // 1. Fetch Orders (withDetails=true so instanceDetails/serial numbers appear in certificates)
            // Lógica con Paginación para no reventar la memoria y evadir timeouts
            let allOrders: any[] = [];
            let currentPage = 1;
            const limit = 50;
            let hasMore = true;

            while (hasMore) {
                setStatusText(`Buscando órdenes (descargando página ${currentPage})...`);

                const response = await axios.get('/api/web/orders', {
                    params: {
                        status: 'completed',
                        startDate,
                        endDate,
                        dateField: 'completionDate',
                        withDetails: 'true',
                        limit,
                        page: currentPage
                    }
                });

                // Como pasamos `limit` y `page`, la respuesta viene en `{ data, pagination }`
                const responseData = response.data;
                const ordersPage = responseData.data || (Array.isArray(responseData) ? responseData : []); // Fallback

                if (!ordersPage || ordersPage.length === 0) {
                    hasMore = false;
                } else {
                    allOrders = [...allOrders, ...ordersPage];
                    if (ordersPage.length < limit || (responseData.pagination && currentPage >= responseData.pagination.pages)) {
                        hasMore = false;
                    } else {
                        currentPage++;
                    }
                }
            }

            const orders = allOrders;
            if (!orders || orders.length === 0) {
                alert("No se encontraron órdenes completadas en este rango.");
                setIsGenerating(false);
                return;
            }

            // Filter by crew if a specific crew is selected
            let filteredOrders = orders;
            if (selectedCrew !== "all") {
                filteredOrders = orders.filter((order: any) => {
                    const crewId = order.assignedTo?._id || order.assignedTo;
                    return String(crewId) === String(selectedCrew);
                });

                if (filteredOrders.length === 0) {
                    alert("No se encontraron órdenes para la cuadrilla seleccionada en este rango.");
                    setIsGenerating(false);
                    return;
                }
            }

            // Sort orders by technician, then by date (Most recent first within each technician)
            filteredOrders.sort((a: any, b: any) => {
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
                const dateA = new Date(a.completionDate || a.updatedAt || a.createdAt).getTime();
                const dateB = new Date(b.completionDate || b.updatedAt || b.createdAt).getTime();
                return dateB - dateA; // Descending order (most recent first)
            });

            setStatusText(`Procesando ${filteredOrders.length} órdenes...`);

            // Initialize PDF - use Oficio size for 3 orders per page, A4 for 1-2
            // Oficio size: 216mm x 330mm (for 3 orders)
            // A4 size: 210mm x 297mm (for 1-2 orders)
            const pageSize = ordersPerPage === 3 ? [216, 330] : 'a4';
            const pdf = new jsPDF('p', 'mm', pageSize as any);
            const pageWidth = ordersPerPage === 3 ? 216 : 210;
            const pageHeight = ordersPerPage === 3 ? 330 : 297;
            const margin = 10;
            const contentWidth = pageWidth - (margin * 2);

            // Calculate image height based on ordersPerPage
            // Available height = 297 - (margin * 2) = 277mm
            const availableHeight = pageHeight - (margin * 2);
            const spacing = 2; // spacing between certificates in mm
            // imgHeight = (availableHeight - (spacing * (ordersPerPage - 1))) / ordersPerPage
            const imgHeight = (availableHeight - (spacing * (ordersPerPage - 1))) / ordersPerPage;
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

            for (let i = 0; i < filteredOrders.length; i++) {
                const order = filteredOrders[i];
                setStatusText(`Generando certificado ${i + 1} de ${filteredOrders.length}...`);
                setProgress(((i + 1) / filteredOrders.length) * 100);

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
                if (itemsOnPage === ordersPerPage) {
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
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Órdenes por Página</label>
                    <select
                        value={ordersPerPage}
                        onChange={(e) => setOrdersPerPage(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary bg-white"
                    >
                        <option value={1}>1 orden por página</option>
                        <option value={2}>2 órdenes por página</option>
                        <option value={3}>3 órdenes por página</option>
                    </select>
                </div>
                <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cuadrilla</label>
                    <select
                        value={selectedCrew}
                        onChange={(e) => setSelectedCrew(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-secondary focus:border-secondary bg-white"
                    >
                        <option value="all">Todas las cuadrillas</option>
                        {crews.map((crew) => (
                            <option key={crew._id} value={crew._id}>
                                Cuadrilla {crew.number}{crew.leader?.name ? ` - ${crew.leader.name}` : ''}
                            </option>
                        ))}
                    </select>
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
