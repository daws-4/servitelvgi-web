"use client";

import React from "react";

interface MetaInfoProps {
    createdAt: string;
    updatedAt: string;
    id: string;
}

export const MetaInfo: React.FC<MetaInfoProps> = ({ createdAt, updatedAt, id }) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInHours < 24) {
            return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
        } else if (diffInDays < 7) {
            return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
        } else {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    };

    const formatId = (fullId: string) => {
        if (fullId.length > 10) {
            return `${fullId.substring(0, 5)}...${fullId.substring(fullId.length - 3)}`;
        }
        return fullId;
    };

    return (
        <div className="p-4 rounded-xl border border-neutral/20 text-xs text-neutral space-y-2">
            <div className="flex justify-between">
                <span>Creado:</span>
                <span className="text-dark">{formatDate(createdAt)}</span>
            </div>
            <div className="flex justify-between">
                <span>Última act:</span>
                <span className="text-dark">{formatDate(updatedAt)}</span>
            </div>
            <div className="flex justify-between">
                <span>ID Sistema:</span>
                <span className="font-mono text-dark">{formatId(id)}</span>
            </div>
        </div>
    );
};

export default MetaInfo;
