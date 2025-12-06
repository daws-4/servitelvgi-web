"use client";

import React from "react";

interface InstallerCrewBadgeProps {
    crewName: string | null;
}

export const InstallerCrewBadge: React.FC<InstallerCrewBadgeProps> = ({ crewName }) => {
    if (!crewName) {
        return (
            <span className="text-gray-400 italic text-xs">-- Individual --</span>
        );
    }

    return (
        <div className="flex items-center gap-1.5 text-secondary font-medium">
            <i className="fa-solid fa-users text-xs"></i> {crewName}
        </div>
    );
};
