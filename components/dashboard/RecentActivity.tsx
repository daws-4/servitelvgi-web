"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface ActivityItem {
    id: string;
    title: string;
    time: string;
    detail: string;
    color: string;
    timestamp: Date;
}

export const RecentActivity = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentActivities();
    }, []);

    const fetchRecentActivities = async () => {
        try {
            setLoading(true);

            // Fetch both inventory and order histories
            const [inventoryResponse, orderResponse] = await Promise.all([
                fetch('/api/web/inventory-histories'),
                fetch('/api/web/order-histories')
            ]);

            const inventoryData = await inventoryResponse.json();
            const orderData = await orderResponse.json();

            // Ensure data is an array, handle error responses
            const inventoryArray = Array.isArray(inventoryData) ? inventoryData : [];
            const orderArray = Array.isArray(orderData) ? orderData : [];

            // Transform inventory history
            const inventoryActivities: ActivityItem[] = inventoryArray.map((item: any) => ({
                id: `inv-${item._id}`,
                title: getInventoryTitle(item),
                time: getRelativeTime(item.createdAt),
                detail: item.item?.description || "Item",
                color: getInventoryColor(item.type),
                timestamp: new Date(item.createdAt)
            }));

            // Transform order history
            const orderActivities: ActivityItem[] = orderArray.map((item: any) => ({
                id: `order-${item._id}`,
                title: getOrderTitle(item),
                time: getRelativeTime(item.createdAt),
                detail: item.order?.subscriberNumber || "Orden",
                color: getOrderColor(item.changeType),
                timestamp: new Date(item.createdAt)
            }));

            // Combine, sort by timestamp (most recent first), and take top 5
            const combined = [...inventoryActivities, ...orderActivities]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 5);

            setActivities(combined);
        } catch (error) {
            console.error("Error fetching recent activities:", error);
        } finally {
            setLoading(false);
        }
    };

    const getInventoryTitle = (item: any) => {
        switch (item.type) {
            case 'entry':
                return 'Ingreso de Inventario';
            case 'assignment':
                return 'Material Asignado';
            case 'return':
                return 'Devolución de Material';
            case 'usage_order':
                return 'Material Usado en Orden';
            case 'adjustment':
                return 'Ajuste de Inventario';
            default:
                return 'Movimiento de Inventario';
        }
    };

    const getOrderTitle = (item: any) => {
        switch (item.changeType) {
            case 'created':
                return `Orden ${item.order?.subscriberNumber} Creada`;
            case 'status_change':
                return `Orden ${item.order?.subscriberNumber} Actualizada`;
            case 'crew_assignment':
                return `Cuadrilla Asignada`;
            case 'materials_added':
                return 'Materiales Agregados';
            case 'completed':
                return `Orden ${item.order?.subscriberNumber} Completada`;
            case 'cancelled':
                return `Orden ${item.order?.subscriberNumber} Cancelada`;
            default:
                return 'Cambio en Orden';
        }
    };

    const getInventoryColor = (type: string) => {
        switch (type) {
            case 'entry':
                return 'bg-green-500';
            case 'assignment':
                return 'bg-blue-500';
            case 'return':
                return 'bg-purple-500';
            case 'usage_order':
                return 'bg-orange-500';
            case 'adjustment':
                return 'bg-gray-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getOrderColor = (changeType: string) => {
        switch (changeType) {
            case 'created':
                return 'bg-blue-500';
            case 'status_change':
                return 'bg-purple-500';
            case 'crew_assignment':
                return 'bg-blue-500';
            case 'materials_added':
                return 'bg-orange-500';
            case 'completed':
                return 'bg-green-500';
            case 'cancelled':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Justo ahora';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
        if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral/10">
            <h3 className="font-bold text-dark mb-4">Actividad Reciente</h3>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-8">
                    <i className="fa-solid fa-inbox text-gray-300 text-3xl mb-2"></i>
                    <p className="text-sm text-gray-500">No hay actividad reciente</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full ${activity.color} mt-2 shrink-0`}></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-dark truncate">{activity.title}</p>
                                <p className="text-xs text-neutral truncate">{activity.time} • {activity.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Link href="/reports/history">
                <button className="w-full mt-6 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                    Ver todo el historial
                </button>
            </Link>
        </div>
    );
};
