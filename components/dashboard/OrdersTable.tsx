"use client";

import React, { useState } from "react";
import axios from "axios";
import { BulkActionBar } from "@/components/orders/BulkActionBar";
import { AssignInstallerModal } from "@/components/orders/AssignInstallerModal";
import { useRouter } from "next/navigation";
import { EditIcon, EyeCloseIcon, TrashIcon } from "@/components/icons";

export interface OrderData {
    _id: string;
    subscriberNumber: string;
    subscriberName: string;
    email?: string;
    type: "instalacion" | "averia" | "otro";
    address: string;
    status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
    assignedTo?: {
        _id: string;
        firstName?: string;
        lastName?: string;
        name?: string;
    };
    phones?: string[];
    node?: string;
    servicesToInstall?: string[];
    createdAt?: string;
    updatedAt?: string;
}

interface OrdersTableProps {
    orders: OrderData[];
    selectedOrders?: Set<string>;
    onSelectOrder?: (orderId: string) => void;
    onSelectAll?: (selected: boolean) => void;
    onViewOrder?: (orderId: string) => void;
    onRefresh?: () => void | Promise<void>;
    onDelete?: (orderIds: string[]) => void | Promise<void>;
    onArchive?: (orderIds: string[]) => void | Promise<void>;
    onAssignInstaller?: (orderIds: string[], installerId: string) => void | Promise<void>;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
    orders,
    selectedOrders = new Set(),
    onSelectOrder,
    onSelectAll,
    onViewOrder,
    onRefresh,
    onDelete,
    onArchive,
    onAssignInstaller,
}) => {
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const allSelected = orders?.length > 0 && orders.every((order) => selectedOrders.has(order._id));
    const someSelected = orders?.some((order) => selectedOrders.has(order._id)) && !allSelected;

    // Internal delete handler
    const handleDelete = async () => {
        const orderIds = Array.from(selectedOrders);

        if (!confirm(`¿Estás seguro de que deseas eliminar ${orderIds.length} orden(es)?`)) {
            return;
        }

        try {
            setIsProcessing(true);

            if (onDelete) {
                // Use custom delete handler if provided
                await onDelete(orderIds);
            } else {
                // Default delete implementation
                const deletePromises = orderIds.map(orderId =>
                    axios.delete(`/api/web/orders?id=${orderId}`)
                );
                await Promise.all(deletePromises);
            }

            // Refresh data
            if (onRefresh) {
                await onRefresh();
            }

            // Clear selection
            if (onSelectAll) {
                onSelectAll(false);
            }

            alert("Órdenes eliminadas exitosamente");
        } catch (err) {
            console.error("Error deleting orders:", err);
            alert("Error al eliminar las órdenes. Por favor, intenta de nuevo.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Internal archive handler
    const handleArchive = async () => {
        const orderIds = Array.from(selectedOrders);

        try {
            setIsProcessing(true);

            if (onArchive) {
                // Use custom archive handler if provided
                await onArchive(orderIds);
            } else {
                // Default archive implementation (placeholder)
                console.log("Archive orders:", orderIds);
                alert("Funcionalidad de archivar pendiente de implementación");
            }

            // Refresh data
            if (onRefresh) {
                await onRefresh();
            }

            // Clear selection
            if (onSelectAll) {
                onSelectAll(false);
            }
        } catch (err) {
            console.error("Error archiving orders:", err);
            alert("Error al archivar las órdenes. Por favor, intenta de nuevo.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Handler to open assign installer modal
    const handleOpenAssignModal = () => {
        setIsAssignModalOpen(true);
    };

    // Handler to confirm installer assignment
    const handleConfirmAssignment = async (installerId: string) => {
        const orderIds = Array.from(selectedOrders);

        try {
            setIsProcessing(true);

            if (onAssignInstaller) {
                // Use custom assign handler if provided
                await onAssignInstaller(orderIds, installerId);
            } else {
                // Default assignment implementation
                const assignPromises = orderIds.map(orderId =>
                    axios.put(`/api/web/orders`, {
                        id: orderId,
                        assignedTo: installerId,
                        status: "assigned" // Optionally update status
                    })
                );
                await Promise.all(assignPromises);
            }

            // Refresh data
            if (onRefresh) {
                await onRefresh();
            }

            // Clear selection
            if (onSelectAll) {
                onSelectAll(false);
            }

            alert(`Instalador asignado exitosamente a ${orderIds.length} orden(es)`);
        } catch (err) {
            console.error("Error assigning installer:", err);
            alert("Error al asignar el instalador. Por favor, intenta de nuevo.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditRedirect = (orderId: string) => {
        router.push(`/dashboard/orders/${orderId}`);
    };


    const handleDeleteOrder = async (orderId: string) => {
        const order = orders?.find(o => o._id === orderId);
        const orderName = order?.subscriberName || 'esta orden';

        if (!confirm(`¿Estás seguro de eliminar ${orderName}? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            setIsProcessing(true);
            await axios.delete(`/api/web/orders`, {
                data: { id: orderId },
            });

            // Refresh orders list
            if (onRefresh) {
                await onRefresh();
            }

            alert('Orden eliminada exitosamente');
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('Error al eliminar la orden. Por favor, intenta de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getTypeBadge = (type: OrderData["type"]) => {
        // Normalize: remove accents and convert to lowercase
        const normalizedType = type
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        if (normalizedType === "instalacion") {
            return (
                <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                    <i className="fa-solid fa-wrench text-[10px]"></i> Instalación
                </span>
            );
        } else if (normalizedType === "averia") {
            return (
                <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                    <i className="fa-solid fa-triangle-exclamation text-[10px]"></i> Avería
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
                <i className="fa-solid fa-question text-[10px]"></i> Otro
            </span>
        );
    };

    const getStatusBadge = (status: OrderData["status"]) => {
        switch (status) {
            case "pending":
                return (
                    <span className="inline-flex items-center py-1 px-2 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span> Pendiente
                    </span>
                );
            case "assigned":
                return (
                    <span className="inline-flex items-center py-1 px-2 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span> Asignada
                    </span>
                );
            case "in_progress":
                return (
                    <span className="inline-flex items-center py-1 px-2 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5"></span> En Proceso
                    </span>
                );
            case "completed":
                return (
                    <span className="inline-flex items-center py-1 px-2 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span> Completada
                    </span>
                );
            case "cancelled":
                return (
                    <span className="inline-flex items-center py-1 px-2 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span> Cancelada
                    </span>
                );
        }
    };

    return (
        <>
            {/* Bulk Action Bar - Only shows when orders are selected */}
            <BulkActionBar
                selectedCount={selectedOrders.size}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onAssignInstaller={handleOpenAssignModal}
            />

            {/* Processing Overlay */}
            {isProcessing && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
                    <div className="bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
                        <p className="text-sm text-gray-600">Procesando...</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-neutral font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="p-4 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(input) => {
                                            if (input) {
                                                input.indeterminate = someSelected;
                                            }
                                        }}
                                        onChange={(e) => onSelectAll?.(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                                    />
                                </th>
                                <th className="p-4">N. Abonado</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Dirección</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4">Técnico</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-50">
                            {orders?.map((order) => {
                                const isSelected = selectedOrders.has(order._id);
                                const technicianName = order.assignedTo?.name || null;
                                const technicianInitials = technicianName
                                    ? technicianName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                    : '';

                                return (
                                    <tr
                                        key={order._id}
                                        className={`transition-colors ${isSelected
                                            ? "bg-blue-50/20 hover:bg-blue-50/30"
                                            : "hover:bg-gray-50"
                                            }`}
                                    >
                                        <td className="p-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => onSelectOrder?.(order._id)}
                                                className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-4 font-medium text-dark cursor-pointer" onClick={() => handleEditRedirect(order._id)}>{order.subscriberNumber}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-dark cursor-pointer" onClick={() => handleEditRedirect(order._id)}>{order.subscriberName}</div>
                                            {order.email && <div className="text-xs text-gray-400 cursor-pointer" onClick={() => handleEditRedirect(order._id)}>{order.email}</div>}
                                        </td>
                                        <td className="p-4">{getTypeBadge(order.type)}</td>
                                        <td className="p-4 text-gray-500 max-w-xs truncate">{order.address}</td>
                                        <td className="p-4">{getStatusBadge(order.status)}</td>
                                        <td className="p-4">
                                            {order.assignedTo && technicianName ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                                                        {technicianInitials}
                                                    </div>
                                                    <span className="text-xs font-medium">{technicianName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">-- Sin Asignar --</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditRedirect(order._id)}
                                                    className="text-gray-400 hover:text-primary transition-colors p-1 cursor-pointer"
                                                    title="Editar"
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOrder(order._id)}
                                                    className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                                                    title="Eliminar"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Installer Modal */}
            <AssignInstallerModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onConfirm={handleConfirmAssignment}
                selectedCount={selectedOrders.size}
            />
        </>
    );
};
