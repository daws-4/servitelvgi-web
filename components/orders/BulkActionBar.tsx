"use client";

import React from "react";

interface BulkActionBarProps {
    selectedCount: number;
    onArchive?: () => void;
    onDelete?: () => void;
    onAssignCrew?: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
    selectedCount,
    onArchive,
    onDelete,
    onAssignCrew,
}) => {
    if (selectedCount === 0) return null;

    return (
        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mb-4 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
                <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                    {selectedCount}
                </span>
                <span className="text-sm text-primary font-medium">
                    {selectedCount === 1 ? "fila seleccionada" : "filas seleccionadas"}
                </span>
            </div>
            <div className="flex gap-2">
                {onAssignCrew && (
                    <button
                        onClick={onAssignCrew}
                        className="text-xs text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors font-medium border border-transparent hover:border-blue-200 cursor-pointer"
                    >
                        <i className="fa-solid fa-users mr-1"></i> Asignar Cuadrilla
                    </button>
                )}
                <button
                    onClick={onArchive}
                    className="text-xs text-yellow-700 hover:bg-yellow-100 px-3 py-1.5 rounded transition-colors font-medium border border-transparent hover:border-yellow-200 cursor-pointer"
                >
                    <i className="fa-solid fa-box-archive mr-1"></i> Archivar
                </button>
                <button
                    onClick={onDelete}
                    className="text-xs text-red-600 hover:bg-red-100 px-3 py-1.5 rounded transition-colors font-medium border border-transparent hover:border-red-200 cursor-pointer"
                >
                    <i className="fa-solid fa-trash mr-1"></i> Eliminar
                </button>
            </div>
        </div>
    );
};
