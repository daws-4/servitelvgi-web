"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { OrderEditForm, OrderEditData } from '@/components/orders/OrderEditForm';
import { OrderHistoryModal } from '@/components/orders/OrderHistoryModal';
import axios from 'axios';
import PocketBase from 'pocketbase';

export default function OrderEditPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params?.id as string;

    const [orderData, setOrderData] = useState<OrderEditData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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
                    let signatureUrl = order.customerSignature;

                    // Fetch signature from PocketBase
                    try {
                        const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL || 'http://localhost:8090');
                        const signatureRecord = await pb.collection('customers_signatures').getFirstListItem(`order_id="${orderId}"`);

                        if (signatureRecord && signatureRecord.image) {
                            signatureUrl = pb.files.getURL(signatureRecord, signatureRecord.image);
                        }
                    } catch (pbError) {
                        // Signature not found or PB error - keep existing or undefined
                        console.log("No signature found in PocketBase or error:", pbError);
                    }

                    // Transform API data to form data structure
                    const formData: OrderEditData = {
                        subscriberNumber: order.subscriberNumber || '',
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
                        assignedTo: order.assignedTo?._id || order.assignedTo || undefined,
                        materialsUsed: order.materialsUsed || [],
                        photoEvidence: order.photoEvidence || [],
                        internetTest: order.internetTest || undefined,
                        customerSignature: signatureUrl || undefined,
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
            phones: data.phones.split(',').map(p => p.trim()).filter(p => p),
            servicesToInstall: data.servicesToInstall.split(',').map(s => s.trim()).filter(s => s),
        });

        if (response.status === 200) {
            alert('¡Orden actualizada correctamente!');
            // Optionally refresh the data
            window.location.reload();
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
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200 uppercase">Cargando...</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto">
                {/* Header Skeleton */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b border-gray-200 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-6 w-64 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
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
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <button onClick={handleCancel} className="text-gray-500 hover:text-primary transition-colors">
                            <i className="fa-solid fa-arrow-left"></i>
                        </button>
                        <h1 className="text-xl font-bold text-primary">Error</h1>
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
        <div className="flex-1 overflow-y-auto">
            {/* HEADER */}
            <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6 border-b border-gray-200 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        className="text-gray-500 hover:text-primary transition-colors"
                    >
                        <i className="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                            Editar Orden
                            <span className="text-gray-400 font-normal">
                                #{orderData.subscriberNumber}
                            </span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(orderData.status)}
                    <img
                        src="https://ui-avatars.com/api/?name=Admin&background=004ba8&color=fff"
                        className="w-8 h-8 rounded-full"
                        alt="User avatar"
                    />
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
