"use client";

import React from "react";

type InstallerStatus = "active" | "on_duty" | "off_duty" | "inactive";

interface InstallerStatusBadgeProps {
    status: InstallerStatus;
}

export const InstallerStatusBadge: React.FC<InstallerStatusBadgeProps> = ({ status }) => {
    const styles = {
        active: "bg-green-100 text-green-700 border-green-200",
        on_duty: "bg-blue-100 text-blue-700 border-blue-200",
        off_duty: "bg-yellow-100 text-yellow-700 border-yellow-200",
        inactive: "bg-gray-100 text-gray-600 border-gray-200",
    };

    const labels = {
        active: "Activo",
        on_duty: "En Guardia",
        off_duty: "Fuera de Guardia",
        inactive: "Inactivo",
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.inactive}`}>
            {labels[status] || status}
        </span>
    );
};
