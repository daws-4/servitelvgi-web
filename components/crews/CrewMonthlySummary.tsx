import React, { useState, useEffect } from "react";

interface MonthlySummaryData {
    totalAsignado: number;
    totalGastado: number;
    totalDevoluciones: number;
    balance: number;
}

interface CrewMonthlySummaryProps {
    crewId: string;
    selectedMonth: string; // Format: "YYYY-MM"
}

export const CrewMonthlySummary: React.FC<CrewMonthlySummaryProps> = ({
    crewId,
    selectedMonth,
}) => {
    const [summary, setSummary] = useState<MonthlySummaryData>({
        totalAsignado: 0,
        totalGastado: 0,
        totalDevoluciones: 0,
        balance: 0,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (crewId && selectedMonth) {
            fetchMonthlySummary();
        }
    }, [crewId, selectedMonth]);

    const fetchMonthlySummary = async () => {
        setLoading(true);
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
                // Calculate summary from movements
                let totalAsignado = 0;
                let totalGastado = 0;
                let totalDevoluciones = 0;

                data.forEach((entry: any) => {
                    if (entry.type === "assignment") {
                        totalAsignado += Math.abs(entry.quantityChange);
                    } else if (entry.type === "usage_order") {
                        totalGastado += Math.abs(entry.quantityChange);
                    } else if (entry.type === "return") {
                        totalDevoluciones += Math.abs(entry.quantityChange);
                    }
                });

                const balance = totalAsignado - totalGastado;

                setSummary({
                    totalAsignado,
                    totalGastado,
                    totalDevoluciones,
                    balance,
                });
            }
        } catch (error) {
            console.error("Error fetching monthly summary:", error);
        } finally {
            setLoading(false);
        }
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
                <div className="flex items-center justify-center h-32">
                    <i className="fa-solid fa-spinner fa-spin text-2xl text-primary"></i>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral/10 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary rounded-lg text-white">
                    <i className="fa-solid fa-chart-line"></i>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-dark">Resumen Mensual</h3>
                    <p className="text-xs text-neutral">{getMonthName(selectedMonth)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Asignado */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <i className="fa-solid fa-truck text-lg"></i>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-blue-600 font-medium mb-1">Total Asignado</p>
                            <p className="text-2xl font-bold text-blue-700">{summary.totalAsignado}</p>
                        </div>
                    </div>
                </div>

                {/* Total Gastado */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <i className="fa-solid fa-tools text-lg"></i>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-orange-600 font-medium mb-1">Total Gastado</p>
                            <p className="text-2xl font-bold text-orange-700">{summary.totalGastado}</p>
                        </div>
                    </div>
                </div>

                {/* Devoluciones */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <i className="fa-solid fa-rotate-left text-lg"></i>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-purple-600 font-medium mb-1">Devoluciones</p>
                            <p className="text-2xl font-bold text-purple-700">{summary.totalDevoluciones}</p>
                        </div>
                    </div>
                </div>

                {/* Balance */}
                <div className={`${summary.balance >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'} rounded-lg p-4 border`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${summary.balance >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-lg`}>
                            <i className={`fa-solid ${summary.balance >= 0 ? 'fa-check-circle' : 'fa-exclamation-circle'} text-lg`}></i>
                        </div>
                        <div className="flex-1">
                            <p className={`text-xs ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'} font-medium mb-1`}>Balance</p>
                            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                {summary.balance >= 0 ? '+' : ''}{summary.balance}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrewMonthlySummary;
