"use client";

import React from "react";

type OnDutyStatus = "active" | "inactive" | "onDuty";

interface InstallerOnDutyBadgeProps {
    onDuty: OnDutyStatus;
}

export const InstallerOnDutyBadge: React.FC<InstallerOnDutyBadgeProps> = ({ onDuty }) => {
    const styles = {
        active: "bg-green-100 text-green-700 border-green-200",
        onDuty: "bg-blue-100 text-blue-700 border-blue-200",
        inactive: "bg-gray-100 text-gray-600 border-gray-200",
    };

    const labels = {
        active: "Activo",
        onDuty: "En Guardia",
        inactive: "Inactivo",
    };

    const icons = {
        active: "fa-circle-check",
        onDuty: "fa-shield-halved",
        inactive: "fa-circle-xmark",
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[onDuty] || styles.inactive}`}>
            <i className={`fa-solid ${icons[onDuty]}`}></i>
            {labels[onDuty] || onDuty}
        </span>
    );
};
