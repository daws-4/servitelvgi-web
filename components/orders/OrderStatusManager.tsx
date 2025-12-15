"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';

export type OrderStatus = "pending" | "assigned" | "in_progress" | "completed" | "cancelled";
export type OrderType = "instalacion" | "averia" | "otro";

interface Crew {
    _id: string;
    name: string;
}

interface OrderStatusManagerProps {
    initialStatus?: OrderStatus;
    initialType?: OrderType;
    initialAssignedTo?: string;
    orderId?: string;
    orderName?: string;
    onStatusChange?: (status: OrderStatus) => void;
    onTypeChange?: (type: OrderType) => void;
    onAssignedToChange?: (crewId: string) => void;
    onSave?: (data: { status: OrderStatus; type: OrderType; assignedTo: string; reportDetails?: string }) => void;
    onCancel?: () => void;
    onDelete?: () => void | Promise<void>;
    isSaving?: boolean;
}

export const OrderStatusManager: React.FC<OrderStatusManagerProps> = ({
    initialStatus = "pending",
    initialType = "instalacion",
    initialAssignedTo = "",
    orderId,
    orderName,
    onStatusChange,
    onTypeChange,
    onAssignedToChange,
    onSave,
    onCancel,
    onDelete,
    isSaving = false
}) => {
    const [status, setStatus] = useState<OrderStatus>(initialStatus);
    const [type, setType] = useState<OrderType>(initialType);
    const [assignedTo, setAssignedTo] = useState(initialAssignedTo);
    const [reportDetails, setReportDetails] = useState("");
    const [crews, setCrews] = useState<Crew[]>([]);
    const [isLoadingCrews, setIsLoadingCrews] = useState(false);

    // Load crews
    useEffect(() => {
        const loadCrews = async () => {
            setIsLoadingCrews(true);
            try {
                const res = await fetch('/api/web/crews');
                if (res.ok) {
                    const data = await res.json();
                    setCrews(data);
                }
            } catch (error) {
                console.error('Error loading crews:', error);
            } finally {
                setIsLoadingCrews(false);
            }
        };

        loadCrews();
    }, []);

    const handleStatusChange = (newStatus: OrderStatus) => {
        setStatus(newStatus);
        if (onStatusChange) onStatusChange(newStatus);
    };

    const handleTypeChange = (newType: OrderType) => {
        setType(newType);
        if (onTypeChange) onTypeChange(newType);
    };

    const handleAssignedToChange = (crewId: string) => {
        setAssignedTo(crewId);

        // If a crew is assigned, automatically change status to 'assigned'
        if (crewId && status === 'pending') {
            setStatus('assigned');
            if (onStatusChange) onStatusChange('assigned');
        }

        if (onAssignedToChange) onAssignedToChange(crewId);
    };

    const handleSave = () => {
        if (onSave) {
            onSave({
                status,
                type,
                assignedTo,
                ...(status === "completed" && { reportDetails })
            });
        }
    };

    const handleDelete = async () => {
        const displayName = orderName || 'esta orden';

        if (!confirm(`¿Estás seguro de eliminar ${displayName}? Esta acción no se puede deshacer.`)) {
            return;
        }

        if (onDelete) {
            await onDelete();
        }
    };

    const getStatusConfig = (currentStatus: OrderStatus) => {
        switch (currentStatus) {
            case 'pending':
                return {
                    colorClass: "text-yellow-500",
                    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
                    description: "Orden creada, pendiente de asignación."
                };
            case 'assigned':
                return {
                    colorClass: "text-blue-500",
                    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
                    description: "Cuadrilla notificada. En espera de inicio."
                };
            case 'in_progress':
                return {
                    colorClass: "text-purple-500",
                    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
                    description: "La cuadrilla está trabajando en el sitio."
                };
            case 'completed':
                return {
                    colorClass: "text-green-500",
                    badgeClass: "bg-green-100 text-green-800 border-green-200",
                    description: "Trabajo finalizado y reportado."
                };
            case 'cancelled':
                return {
                    colorClass: "text-red-500",
                    badgeClass: "bg-red-100 text-red-800 border-red-200",
                    description: "Orden cancelada por el operador."
                };
        }
    };

    const statusConfig = getStatusConfig(status);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-fit lg:sticky lg:top-24">
            <div className="bg-accent/30 border-b border-accent px-6 py-4">
                <h3 className="font-semibold text-secondary">Estado y Asignación</h3>
            </div>
            <div className="p-6 space-y-6">

                {/* Status Selection */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                        Estado Actual
                    </label>
                    <div className="relative">
                        <select
                            value={status}
                            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                            className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-md bg-white font-semibold text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                        >
                            <option value="pending">Pendiente</option>
                            <option value="assigned">Asignada</option>
                            <option value="in_progress">En Progreso</option>
                            <option value="completed">Completada</option>
                            <option value="cancelled">Cancelada</option>
                        </select>
                        {/* Status Icon */}
                        <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none">
                            <i className={`fa-solid fa-circle ${statusConfig.colorClass}`}></i>
                        </div>
                        {/* Chevron */}
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                            <i className="fa-solid fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        {statusConfig.description}
                    </p>
                </div>

                <hr className="border-gray-100" />


                {/* Technician Assignment */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                        Cuadrilla Asignada
                    </label>
                    <div className="relative">
                        <i className="fa-solid fa-users absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <select
                            value={assignedTo}
                            onChange={(e) => handleAssignedToChange(e.target.value)}
                            disabled={isLoadingCrews}
                            className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-md bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="">-- Sin Asignar --</option>
                            {crews.map(crew => (
                                <option key={crew._id} value={crew._id}>
                                    {crew.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                            <i className="fa-solid fa-chevron-down text-xs"></i>
                        </div>
                    </div>
                </div>


                {/* Order Type */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                        Tipo de Orden
                    </label>
                    <select
                        value={type}
                        onChange={(e) => handleTypeChange(e.target.value as OrderType)}
                        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-md bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                    >
                        <option value="instalacion">Instalación</option>
                        <option value="averia">Avería</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>

                {/* Closure Details - Only visible when completed */}
                {status === "completed" && (
                    <div className="animate-pulse bg-green-50 p-3 rounded border border-green-100">
                        <label className="block text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                            Detalles de Cierre
                        </label>
                        <textarea
                            value={reportDetails}
                            onChange={(e) => setReportDetails(e.target.value)}
                            placeholder="Comentarios finales del técnico..."
                            className="w-full px-3 py-2 border-2 border-green-200 rounded-md bg-white text-sm focus:border-green-400 focus:outline-none resize-y min-h-[80px]"
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-primary hover:bg-secondary text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isSaving ? (
                            <>
                                <i className="fa-solid fa-circle-notch fa-spin"></i> Guardando...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-save"></i> Guardar Cambios
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSaving || !orderId}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        <i className="fa-solid fa-trash"></i> Eliminar Orden
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="w-full bg-white hover:bg-gray-50 text-gray-600 font-medium py-3 px-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};
