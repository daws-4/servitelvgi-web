import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
} from "@heroui/react";
import DateRangePicker from "@/components/interactiveForms/DateRangePicker";
import FormButton from "@/components/interactiveForms/Button";
import { parseDate } from "@internationalized/date";

interface HistoryEntry {
    _id: string;
    order: {
        _id: string;
        subscriberNumber: string;
        subscriberName: string;
    };
    changeType: "status_change" | "crew_assignment" | "materials_added" | "completed" | "cancelled" | "created" | "updated";
    previousValue?: any;
    newValue?: any;
    description: string;
    crew?: {
        _id: string;
        name: string;
    };
    changedBy?: {
        _id: string;
        name?: string;
        surname?: string;
        username?: string;
    };
    createdAt: string;
}

interface OrderHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId?: string; // Optional: filter by specific order
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
    isOpen,
    onClose,
    orderId,
}) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

    // Calculate current week range (Monday to Sunday)
    const getCurrentWeekRange = () => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust so Monday is the first day

        // First day of the week (Monday)
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        // Last day of the week (Sunday)
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return {
            start: monday.toISOString().split('T')[0], // "2025-12-16"
            end: sunday.toISOString().split('T')[0],   // "2025-12-22"
        };
    };

    // Set current week range when opening the modal
    useEffect(() => {
        if (isOpen && !dateRange) {
            const weekRange = getCurrentWeekRange();
            setDateRange(weekRange);
        }
    }, [isOpen]);

    // Fetch history when date range changes
    useEffect(() => {
        if (isOpen && dateRange) {
            fetchHistory(dateRange.start, dateRange.end);
        }
    }, [isOpen, dateRange, orderId]);

    const fetchHistory = async (startDate?: string, endDate?: string) => {
        setLoading(true);
        try {
            let url = "/api/web/order-histories";

            // Build query params
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (orderId) params.append("orderId", orderId);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            console.log("📦 Order history data received:", data);

            if (Array.isArray(data)) {
                setHistory(data);
            } else {
                setHistory([]);
            }
        } catch (err) {
            console.error("Error fetching order history:", err);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle date range change
    const handleDateChange = (range: { start: string; end: string } | null) => {
        setDateRange(range);
    };

    const getTypeInfo = (type: string) => {
        switch (type) {
            case "created":
                return {
                    icon: "fa-solid fa-plus-circle",
                    label: "Creada",
                    color: "text-blue-600",
                    bgColor: "bg-blue-100",
                };
            case "status_change":
                return {
                    icon: "fa-solid fa-exchange-alt",
                    label: "Cambio de Estado",
                    color: "text-purple-600",
                    bgColor: "bg-purple-100",
                };
            case "crew_assignment":
                return {
                    icon: "fa-solid fa-users",
                    label: "Asignación de Cuadrilla",
                    color: "text-blue-600",
                    bgColor: "bg-blue-100",
                };
            case "materials_added":
                return {
                    icon: "fa-solid fa-box",
                    label: "Materiales Actualizados",
                    color: "text-orange-600",
                    bgColor: "bg-orange-100",
                };
            case "completed":
                return {
                    icon: "fa-solid fa-check-circle",
                    label: "Completada",
                    color: "text-green-600",
                    bgColor: "bg-green-100",
                };
            case "cancelled":
                return {
                    icon: "fa-solid fa-times-circle",
                    label: "Cancelada",
                    color: "text-red-600",
                    bgColor: "bg-red-100",
                };
            case "updated":
                return {
                    icon: "fa-solid fa-edit",
                    label: "Actualizada",
                    color: "text-gray-600",
                    bgColor: "bg-gray-100",
                };
            default:
                return {
                    icon: "fa-solid fa-circle",
                    label: type,
                    color: "text-gray-600",
                    bgColor: "bg-gray-100",
                };
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "Fecha no disponible";

        const date = new Date(dateString);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return "Fecha no disponible";
        }

        return new Intl.DateTimeFormat("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="3xl"
            scrollBehavior="inside"
            classNames={{
                base: "max-w-4xl",
                backdrop: "bg-dark/50 backdrop-blur-sm",
                wrapper: "overflow-hidden",
            }}
        >
            <ModalContent className="max-h-[80vh]">
                <ModalHeader className="flex-shrink-0 border-b border-neutral/10 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg text-white">
                            <i className="fa-solid fa-clock-rotate-left"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-dark">
                                Historial de {orderId ? "Orden" : "Órdenes"}
                            </h3>
                            <p className="text-xs text-neutral font-normal">
                                Registro de cambios y actualizaciones de órdenes
                            </p>
                        </div>
                    </div>
                </ModalHeader>

                <ModalBody className="flex-1 overflow-y-auto py-6">
                    {/* Filters */}
                    <div className="mb-6 flex gap-4">
                        <div className="flex-1">
                            <DateRangePicker
                                label="Rango de Fechas"
                                value={dateRange ? {
                                    start: parseDate(dateRange.start),
                                    end: parseDate(dateRange.end)
                                } : null}
                                onDateChange={handleDateChange}
                                classNames={{
                                    base: "max-w-md",
                                }}
                            />
                        </div>
                    </div>

                    {/* Timeline */}
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="text-neutral mt-4">Cargando historial...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8">
                            <i className="fa-solid fa-inbox text-6xl text-neutral/30 mb-4"></i>
                            <p className="text-neutral text-lg">No hay cambios registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((entry, index) => {
                                const typeInfo = getTypeInfo(entry.changeType);
                                return (
                                    <div
                                        key={entry._id || index}
                                        className="flex gap-4 p-4 bg-white border border-neutral/10 rounded-lg hover:shadow-sm transition-shadow"
                                    >
                                        {/* Icon Column */}
                                        <div className="flex-shrink-0">
                                            <div
                                                className={`w-10 h-10 rounded-full ${typeInfo.bgColor} flex items-center justify-center ${typeInfo.color}`}
                                            >
                                                <i className={typeInfo.icon}></i>
                                            </div>
                                        </div>

                                        {/* Content Column */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span
                                                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${typeInfo.bgColor} ${typeInfo.color}`}
                                                        >
                                                            {typeInfo.label}
                                                        </span>
                                                        <span className="text-xs text-neutral">
                                                            {formatDate(entry.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="font-medium text-dark">
                                                        {entry.description}
                                                    </p>
                                                    {entry.order && (
                                                        <p className="text-sm text-neutral mt-1">
                                                            <i className="fa-solid fa-file-lines mr-1"></i>
                                                            Orden: {entry.order.subscriberNumber} - {entry.order.subscriberName}
                                                        </p>
                                                    )}
                                                    {entry.crew?.name && (
                                                        <p className="text-xs text-neutral mt-1">
                                                            <i className="fa-solid fa-users mr-1"></i>
                                                            Cuadrilla: {entry.crew.name}
                                                        </p>
                                                    )}
                                                    {entry.changedBy && (
                                                        <p className="text-xs text-neutral mt-1">
                                                            <i className="fa-solid fa-user mr-1"></i>
                                                            Por: {entry.changedBy.name || entry.changedBy.username || 'Usuario'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ModalBody>

                <ModalFooter className="flex-shrink-0 bg-gray-50 border-t border-neutral/10">
                    <FormButton variant="secondary" onPress={onClose}>
                        Cerrar
                    </FormButton>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default OrderHistoryModal;
