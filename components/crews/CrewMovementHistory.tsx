import React, { useState, useEffect } from "react";

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

interface CrewMovementHistoryProps {
    crewId: string;
    selectedMonth: string; // Format: "YYYY-MM"
}

export const CrewMovementHistory: React.FC<CrewMovementHistoryProps> = ({
    crewId,
    selectedMonth,
}) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const itemsPerPage = 10;

    useEffect(() => {
        if (crewId && selectedMonth) {
            // Reset when month or crew changes
            setHistory([]);
            setPage(1);
            setHasMore(true);
            fetchHistory(1, true);
        }
    }, [crewId, selectedMonth]);

    const fetchHistory = async (pageNum: number, reset: boolean = false) => {
        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            // Parse selected month to get start and end dates
            const [year, month] = selectedMonth.split("-");
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

            // Fetch history for this crew and month
            const params = new URLSearchParams({
                crewId,
                startDate: startDate.toISOString().split("T")[0],
                endDate: endDate.toISOString().split("T")[0],
            });

            const response = await fetch(`/api/web/inventory-histories?${params.toString()}`);
            const data = await response.json();

            if (Array.isArray(data)) {
                // Sort by date descending (newest first)
                const sortedData = data.sort((a, b) => {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });

                // Implement client-side pagination
                const startIndex = (pageNum - 1) * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const paginatedData = sortedData.slice(startIndex, endIndex);

                if (reset) {
                    setHistory(paginatedData);
                } else {
                    setHistory(prev => [...prev, ...paginatedData]);
                }

                // Check if there are more items
                setHasMore(endIndex < sortedData.length);
            } else {
                setHistory([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error fetching crew movement history:", error);
            if (reset) {
                setHistory([]);
            }
            setHasMore(false);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchHistory(nextPage, false);
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

    const getMonthName = (monthStr: string) => {
        const [year, month] = monthStr.split("-");
        const monthNames = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-neutral/10 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-primary rounded-lg text-white">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-dark">Historial de Movimientos</h3>
                        <p className="text-xs text-neutral">{getMonthName(selectedMonth)}</p>
                    </div>
                </div>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-neutral mt-4">Cargando historial...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral/10 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary rounded-lg text-white">
                    <i className="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-dark">Historial de Movimientos</h3>
                    <p className="text-xs text-neutral">{getMonthName(selectedMonth)} - Mostrando {history.length} movimientos</p>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="text-center py-8">
                    <i className="fa-solid fa-inbox text-6xl text-neutral/30 mb-4"></i>
                    <p className="text-neutral text-lg">No hay movimientos registrados en este mes</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {history.map((entry, index) => {
                            const typeInfo = getTypeInfo(entry.type);
                            return (
                                <div
                                    key={entry._id || index}
                                    className="flex gap-4 p-4 bg-gray-50 border border-neutral/10 rounded-lg hover:shadow-sm transition-shadow"
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
                                                <p className="text-xs text-neutral">
                                                    Código: {entry.item?.code || "N/A"}
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

                    {/* Load More Button */}
                    {hasMore && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                            >
                                {loadingMore ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        Cargando más...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-arrow-down"></i>
                                        Cargar más movimientos
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CrewMovementHistory;
