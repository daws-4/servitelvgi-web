"use client";

import React from "react";

interface InstallerCrewBadgeProps {
    crewNumber: number | null;
}

export const InstallerCrewBadge: React.FC<InstallerCrewBadgeProps> = ({ crewNumber }) => {
    if (!crewNumber) {
        return (
            <span className="text-gray-400 italic text-xs">-- Individual --</span>
        );
    }

    return (
        <div className="flex items-center gap-1.5 text-secondary font-medium">
            <i className="fa-solid fa-users text-xs"></i> {crewNumber}
        </div>
    );
};
