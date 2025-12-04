import React from "react";

export const RecentActivity = () => {
    const activities = [
        {
            id: 1,
            title: "Orden #NET-1029 Finalizada",
            time: "Hace 10 min",
            detail: "Técnico: Juan P.",
            color: "bg-green-500"
        },
        {
            id: 2,
            title: "Nuevo material asignado",
            time: "Hace 45 min",
            detail: "50m Cable UTP",
            color: "bg-primary"
        },
        {
            id: 3,
            title: "Orden #NET-1030 Recibida",
            time: "Hace 1 hora",
            detail: "Via WhatsApp",
            color: "bg-yellow-500"
        },
        {
            id: 4,
            title: "Alerta de Stock Bajo",
            time: "Hace 2 horas",
            detail: "Conectores RJ45",
            color: "bg-red-500"
        }
    ];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral/10">
            <h3 className="font-bold text-dark mb-4">Actividad Reciente</h3>
            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full ${activity.color} mt-2 shrink-0`}></div>
                        <div>
                            <p className="text-sm font-medium text-dark">{activity.title}</p>
                            <p className="text-xs text-neutral">{activity.time} • {activity.detail}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-6 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors">
                Ver todo el historial
            </button>
        </div>
    );
};
