"use client";

import React from "react";

interface CrewStatusBadgeProps {
    isActive: boolean;
}

export const CrewStatusBadge: React.FC<CrewStatusBadgeProps> = ({ isActive }) => {
    if (isActive) {
        return (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center w-fit gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                Activa
            </span>
        );
    }

    return (
        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold flex items-center w-fit gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            Inactiva
        </span>
    );
};
