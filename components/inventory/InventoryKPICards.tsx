import React from "react";
import { StatCard } from "@/components/dashboard/StatCard";

interface InventoryStats {
    totalItems: number;
    criticalStock: number;
    totalUnits: number;
    todayMovements: number;
    inboundToday?: number;
}

interface InventoryKPICardsProps {
    stats: InventoryStats;
    loading?: boolean;
}

export const InventoryKPICards: React.FC<InventoryKPICardsProps> = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-neutral/10 animate-pulse">
                        <div className="h-20"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1: Total Referencias */}
            <StatCard
                title="Total Referencias"
                value={stats.totalItems.toLocaleString()}
                icon={<i className="fa-solid fa-list-ul text-lg"></i>}
                iconBgColor="bg-blue-100"
                iconColor="text-primary"
                alertMessage="En catálogo activo"
            />

            {/* Card 2: Stock Crítico */}
            <StatCard
                title="Stock Crítico"
                value={stats.criticalStock}
                subValue="ítems"
                icon={<i className="fa-solid fa-triangle-exclamation text-lg"></i>}
                iconBgColor="bg-red-100"
                iconColor="text-red-600"
                alertMessage="Requiere reposición urgente"
            />

            {/* Card 3: Unidades Totales */}
            <StatCard
                title="Unidades Totales"
                value={stats.totalUnits.toLocaleString()}
                icon={<i className="fa-solid fa-cubes-stacked text-lg"></i>}
                iconBgColor="bg-purple-100"
                iconColor="text-purple-600"
                alertMessage="Volumen físico en almacén"
            />

            {/* Card 4: Movimientos Hoy */}
            <StatCard
                title="Movimientos Hoy"
                value={stats.todayMovements}
                icon={<i className="fa-solid fa-arrow-right-arrow-left text-lg"></i>}
                iconBgColor="bg-green-100"
                iconColor="text-green-600"
                trend={
                    stats.inboundToday
                        ? {
                            value: `${stats.inboundToday} ingresos`,
                            isPositive: true,
                            label: "",
                        }
                        : undefined
                }
            />
        </div>
    );
};

export default InventoryKPICards;
