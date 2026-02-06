"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { OrderEditForm, OrderEditData } from '@/components/orders/OrderEditForm';
import { OrderHistoryModal } from '@/components/orders/OrderHistoryModal';
import { OrderCompletionCertificate } from '@/components/orders/OrderCompletionCertificate';
import axios from 'axios';
import PocketBase from 'pocketbase';
import html2canvas from 'html2canvas';

export default function OrderEditPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params?.id as string;

    const [orderData, setOrderData] = useState<OrderEditData | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isAvaliableToSend, setIsAvaliableToSend] = useState(false);


    // Logic to enable or disable sent button
    useEffect(() => {
        if (orderData) {
            setIsAvaliableToSend(orderData.status === 'completed' || orderData.status === 'cancelled');
        }
    }, [orderData]);

    // Ref for the certificate component
    const certificateRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!orderId) {
            setError('ID de orden no encontrado');
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch order data
                const response = await axios.get(`/api/web/orders?id=${orderId}`);

                if (response.data) {
                    const order = response.data;
                    const signatureUrl = order.customerSignature;

                    console.log('Order loaded:', {
                        id: order._id,
                        hasSignature: !!signatureUrl,
                        signatureUrl: signatureUrl
                    });

                    // Transform API data to form data structure
                    const formData: OrderEditData = {
                        subscriberNumber: order.subscriberNumber || '',
                        ticket_id: order.ticket_id || '',
                        subscriberName: order.subscriberName || '',
                        phones: Array.isArray(order.phones) ? order.phones.join(', ') : (order.phones || ''),
                        email: order.email || '',
                        address: order.address || '',
                        node: order.node || '',
                        servicesToInstall: Array.isArray(order.servicesToInstall)
                            ? order.servicesToInstall.join(', ')
                            : (order.servicesToInstall || ''),
                        type: order.type || 'instalacion',
                        status: order.status || 'pending',
                        assignedTo: order.assignedTo?._id || (typeof order.assignedTo === 'string' ? order.assignedTo : undefined),
                        technicianName: (order.assignedTo && typeof order.assignedTo === 'object' && order.assignedTo.leader)
                            ? `${order.assignedTo.leader.name} ${order.assignedTo.leader.surname}`
                            : undefined,
                        materialsUsed: order.materialsUsed || [],
                        photoEvidence: order.photoEvidence || [],
                        internetTest: order.internetTest || undefined,
                        customerSignature: signatureUrl || undefined,
                        installerLog: order.installerLog || [],
                        equipmentRecovered: order.equipmentRecovered,
                        updatedAt: order.updatedAt,
                        visitCount: order.visitCount || 0,
                        powerNap: order.powerNap || '',
                        powerRoseta: order.powerRoseta || '',
                        remainingPorts: order.remainingPorts || undefined,
                        etiqueta: order.etiqueta || undefined,
                        sentToNetuno: order.sentToNetuno || false,
                        serialNap: order.serialNap || '',
                        usedPort: order.usedPort || '',
                    };

                    setOrderData(formData);
                } else {
                    setError('Orden no encontrada');
                }
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Error al cargar la orden. Por favor, intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    const handleSave = async (data: OrderEditData) => {
        if (!orderId) {
            alert('Error: ID de orden no disponible');
            return;
        }

        const response = await axios.put('/api/web/orders', {
            id: orderId,
            ...data,
            powerNap: data.powerNap,
            powerRoseta: data.powerRoseta,
            remainingPorts: data.remainingPorts,
            phones: data.phones.split(',').map(p => p.trim()).filter(p => p),
            servicesToInstall: data.servicesToInstall.split(',').map(s => s.trim()).filter(s => s),
            serialNap: data.serialNap,
            usedPort: data.usedPort,
        });

        if (response.status === 200) {
            alert('¡Orden actualizada correctamente!');
            // Optionally refresh the data
            window.location.reload();
        }
    };

    const handleSyncNetuno = async () => {
        if (!orderId || !orderData || !certificateRef.current) return;

        if (orderData.status !== 'completed' && orderData.status !== 'cancelled') {
            alert('La orden debe estar completada o cancelada para sincronizar con Netuno');
            return;
        }

        if (!confirm('¿Estás seguro de que quieres generar el certificado, guardarlo y enviar los datos a Netuno (WhatsApp)?')) {
            return;
        }

        try {
            setSyncing(true);

            // 1. GENERATE IMAGE
            console.log("📸 Generating Certificate Image...");
            // Wait a moment for any potential renders
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Convert to Blob
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error("Failed to generate image blob");
            const file = new File([blob], "certificate.png", { type: "image/png" });

            // 2. UPLOAD TO BACKEND
            console.log("⬆️ Uploading Certificate...");
            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('ticketId', orderData.ticket_id || orderData.subscriberNumber);
            formData.append('image', file);

            const uploadResponse = await axios.post('/api/web/certificates/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!uploadResponse.data.success) {
                throw new Error("Upload failed: " + (uploadResponse.data.error || 'Unknown error'));
            }

            const publicUrl = uploadResponse.data.url;
            console.log("✅ Certificate Uploaded:", publicUrl);

            // 3. TRIGGER SYNC (Passing the URL explicitly)
            console.log("🔄 Triggering Netuno Sync...", { publicUrl });
            const response = await axios.post(`/api/web/orders/${orderId}/sync`, {
                certificateUrl: publicUrl
            });

            if (response.data.success) {
                setOrderData(prev => prev ? ({ ...prev, sentToNetuno: true }) : null);
                alert(`¡Éxito! \n\n1. Certificado Guardado\n2. Datos enviados a Netuno/WhatsApp`);
            } else {
                alert('Certificado guardado, pero error al enviar a Netuno: ' + (response.data.error || 'Error desconocido'));
            }
        } catch (error: any) {
            console.error('Error syncing:', error);
            alert('Error en el proceso: ' + (error.message || error));
        } finally {
            setSyncing(false);
        }
    };

    const handleExportImage = async () => {
        if (!certificateRef.current || !orderData) return;

        try {
            setExporting(true);

            // Wait a moment for any potential renders
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(certificateRef.current, {
                scale: 2, // Higher resolution
                useCORS: true, // For images from other domains (like signatures)
                logging: true,
                backgroundColor: '#ffffff'
            });

            // Convert to blob and download
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `${orderData.ticket_id || orderData.subscriberNumber}.png`;
            link.click();

        } catch (err) {
            console.error('Error exporting image:', err);
            alert('Error al exportar la imagen. Intenta de nuevo.');
        } finally {
            setExporting(false);
        }
    };

    const handleCancel = () => {
        router.push('/dashboard/orders');
    };

    const handleDelete = async () => {
        if (!orderId) {
            alert('Error: ID de orden no disponible');
            return;
        }

        try {
            await axios.delete('/api/web/orders', {
                data: { id: orderId }
            });

            alert('Orden eliminada exitosamente');
            router.push('/dashboard/orders');
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Error al eliminar la orden. Por favor, intenta de nuevo.');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 uppercase">Pendiente</span>;
            case 'assigned':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">Asignada</span>;
            case 'in_progress':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase">En Progreso</span>;
            case 'completed':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 uppercase">Completada</span>;
            case 'cancelled':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 uppercase">Cancelada</span>;
            case 'hard':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 uppercase">Hard</span>;
            case 'visita':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 uppercase">Visita</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200 uppercase">Cargando...</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto">
                {/* Header Skeleton */}
                <header className="min-h-16 bg-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-3 md:py-0 border-b border-gray-200 sticky top-0 z-50 gap-3 md:gap-0">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                        <div className="h-6 flex-1 md:w-64 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end">
                        <div className="h-6 w-20 md:w-24 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                    </div>
                </header>

                {/* Content Skeleton */}
                <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-64 animate-pulse"></div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-48 animate-pulse"></div>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-64 animate-pulse"></div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-96 animate-pulse"></div>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !orderData) {
        return (
            <div className="flex-1 overflow-y-auto">
                <header className="min-h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-6 py-3 md:py-0 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <button onClick={handleCancel} className="text-gray-500 hover:text-primary transition-colors flex-shrink-0">
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <h1 className="text-lg md:text-xl font-bold text-primary">Error</h1>
                    </div>
                </header>
                <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                        <i className="fa-solid fa-triangle-exclamation text-red-500 text-4xl mb-4"></i>
                        <h3 className="text-lg font-semibold text-red-700 mb-2">Error al cargar la orden</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={handleCancel}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Volver a Órdenes
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto relative">
            {/* HIDDEN CERTIFICATE COMPONENT (Off-screen) */}
            <div className="absolute top-0 left-[-9999px]">
                <OrderCompletionCertificate ref={certificateRef} data={orderData} />
            </div>

            {/* HEADER */}
            <header className="min-h-16 bg-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-3 md:py-0 border-b border-gray-200 sticky top-0 z-50 gap-3 md:gap-0">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleCancel}
                        className="text-gray-500 hover:text-primary transition-colors flex-shrink-0"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg md:text-xl font-bold text-primary flex flex-wrap items-center gap-2">
                            <span className="whitespace-nowrap">Editar Orden</span>
                            <span className="text-gray-400 font-normal text-sm md:text-base truncate">
                                #{orderData.ticket_id}
                            </span>
                            {/* Visit Count Badge */}
                            {(orderData.visitCount || 0) > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-pink-100 text-pink-700 border border-pink-200" title="Cantidad de Visitas Técnicas">
                                    <i className="fa-solid fa-location-dot text-[10px]"></i>
                                    {orderData.visitCount}
                                </span>
                            )}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end flex-wrap">
                    {/* EXPORT BUTTON - Hidden on mobile */}
                    <button
                        onClick={handleExportImage}
                        disabled={exporting}
                        className={`flex items-center gap-2 cursor-pointer px-2 md:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${exporting
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                            }`}
                        title="Exportar como Imagen"
                    >
                        {exporting ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                <span className="hidden md:inline">Generando...</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-image"></i>
                                <span className="hidden md:inline">Exportar</span>
                            </>
                        )}
                    </button>

                    {/* Sent to Netuno Status */}
                    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-colors ${orderData.sentToNetuno
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}
                        title={orderData.sentToNetuno ? "Enviado a Netuno" : "No enviado a Netuno"}>
                        <input
                            type="checkbox"
                            checked={orderData.sentToNetuno || false}
                            disabled
                            className={`w-4 h-4 rounded border-gray-300 cursor-not-allowed ${orderData.sentToNetuno ? 'text-blue-600 accent-blue-600' : 'text-gray-400'}`}
                        />
                        <span className="text-xs font-medium hidden sm:inline">Enviado</span>
                    </div>

                    {/* SYNC BUTTON - Hidden on mobile */}
                    <button
                        onClick={handleSyncNetuno}
                        disabled={syncing || !isAvaliableToSend}
                        className={`flex items-center gap-2 cursor-pointer px-2 md:px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${syncing || !isAvaliableToSend
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                            }`}
                        title="Enviar datos a Google Sheets/Netuno"
                    >
                        {syncing ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                <span className="hidden md:inline">Enviando...</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-cloud-arrow-up"></i>
                                <span className="hidden md:inline">Netuno</span>
                            </>
                        )}
                    </button>
                    {getStatusBadge(orderData.status)}
                </div>
            </header>

            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                <OrderEditForm
                    orderId={orderId}
                    initialData={orderData}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                />
            </main>

            {/* Order History Modal */}
            <OrderHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                orderId={orderId}
            />
        </div>
    );
}
