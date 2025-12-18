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
    item: {
        _id: string;
        code: string;
        description: string;
    };
    type: "entry" | "assignment" | "return" | "usage_order" | "adjustment";
    quantityChange: number;
    reason?: string;
    crew?: {
        _id: string;
        name: string;
    };
    order?: {
        _id: string;
        subscriberNumber: string;
    };
    performedBy?: {
        _id: string;
        name?: string;
        surname?: string;
        username?: string;
    };
    createdAt: string;
}

interface InventoryHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InventoryHistoryModal: React.FC<InventoryHistoryModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);

    // Calcular el rango de la semana actual (lunes a domingo)
    const getCurrentWeekRange = () => {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajuste para que lunes sea el primer día

        // Primer día de la semana (lunes)
        const monday = new Date(now);
        monday.setDate(now.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        // Último día de la semana (domingo)
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        return {
            start: monday.toISOString().split('T')[0], // "2025-12-16"
            end: sunday.toISOString().split('T')[0],   // "2025-12-22"
        };
    };

    // Establecer rango de semana actual al abrir el modal
    useEffect(() => {
        if (isOpen && !dateRange) {
            const weekRange = getCurrentWeekRange();
            setDateRange(weekRange);
        }
    }, [isOpen]);

    // Fetchear historial cuando cambie el rango de fechas
    useEffect(() => {
        if (isOpen && dateRange) {
            fetchHistory(dateRange.start, dateRange.end);
        }
    }, [isOpen, dateRange]);

    const fetchHistory = async (startDate?: string, endDate?: string) => {
        setLoading(true);
        try {
            let url = "/api/web/inventory-histories";

            // Si hay rango de fechas, agregar como query params
            if (startDate && endDate) {
                const params = new URLSearchParams({
                    startDate,
                    endDate,
                });
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            console.log("📦 Datos del historial recibidos:", data);
            console.log("📦 Primera entrada:", data[0]);

            if (Array.isArray(data)) {
                setHistory(data);
            } else {
                setHistory([]);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    // Manejador de cambio de rango de fechas
    const handleDateChange = (range: { start: string; end: string } | null) => {
        setDateRange(range);
    };

    const getTypeInfo = (type: string) => {
        switch (type) {
            case "entry":
                return {
                    icon: "fa-solid fa-arrow-down",
                    label: "Ingreso",
                    color: "text-green-600",
                    bgColor: "bg-green-100",
                };
            case "assignment":
                return {
                    icon: "fa-solid fa-truck",
                    label: "Asignación",
                    color: "text-blue-600",
                    bgColor: "bg-blue-100",
                };
            case "return":
                return {
                    icon: "fa-solid fa-rotate-left",
                    label: "Devolución",
                    color: "text-purple-600",
                    bgColor: "bg-purple-100",
                };
            case "usage_order":
                return {
                    icon: "fa-solid fa-tools",
                    label: "Uso en Orden",
                    color: "text-orange-600",
                    bgColor: "bg-orange-100",
                };
            case "adjustment":
                return {
                    icon: "fa-solid fa-wrench",
                    label: "Ajuste",
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
                            <h3 className="text-lg font-bold text-dark">Historial de Movimientos</h3>
                            <p className="text-xs text-neutral font-normal">
                                Registro de ingresos y salidas de inventario
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
                            <p className="text-neutral text-lg">No hay movimientos registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((entry, index) => {
                                const typeInfo = getTypeInfo(entry.type);
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
                                                        {entry.item?.description || "Item no especificado"}
                                                    </p>
                                                    <p className="text-sm text-neutral mt-1">
                                                        Cantidad:{" "}
                                                        <span
                                                            className={`font-bold ${entry.quantityChange > 0
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                                }`}
                                                        >
                                                            {entry.quantityChange > 0 ? "+" : ""}
                                                            {entry.quantityChange}
                                                        </span>
                                                    </p>
                                                    {entry.crew?.name && (
                                                        <p className="text-xs text-neutral mt-1">
                                                            <i className="fa-solid fa-users mr-1"></i>
                                                            Cuadrilla: {entry.crew.name}
                                                        </p>
                                                    )}
                                                    {entry.order?.subscriberNumber && (
                                                        <p className="text-xs text-neutral mt-1">
                                                            <i className="fa-solid fa-file-lines mr-1"></i>
                                                            Orden: {entry.order.subscriberNumber}
                                                        </p>
                                                    )}
                                                    {entry.reason && (
                                                        <p className="text-xs text-neutral mt-1">
                                                            <i className="fa-solid fa-note-sticky mr-1"></i>
                                                            {entry.reason}
                                                        </p>
                                                    )}
                                                    {entry.performedBy && (
                                                        <p className="text-xs text-neutral mt-1">
                                                            <i className="fa-solid fa-user mr-1"></i>
                                                            Por: {entry.performedBy.name || entry.performedBy.username || 'Usuario'}
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

export default InventoryHistoryModal;
