"use client";

import React from "react";
import { InstallerStatusBadge } from "./InstallerStatusBadge";
import { InstallerCrewBadge } from "./InstallerCrewBadge";
import { EditIcon, EyeCloseIcon, TrashIcon } from "@/components/icons";

export interface Installer {
    id: string;
    name: string;
    phone: string;
    surname: string;
    status: "active" | "inactive";
    currentCrew: string | null;
}

interface InstallersTableProps {
    installers: Installer[];
    selectedIds: string[];
    onSelectAll?: (selected: boolean) => void;
    onSelectRow?: (id: string, selected: boolean) => void;
    onEdit?: (installer: Installer) => void;
    onViewDetails?: (installer: Installer) => void;
    onDelete?: (installer: Installer) => void;
}

export const InstallersTable: React.FC<InstallersTableProps> = ({
    installers,
    selectedIds,
    onSelectAll,
    onSelectRow,
    onEdit,
    onViewDetails,
    onDelete,
}) => {
    const allSelected = installers.length > 0 && selectedIds.length === installers.length;
    const someSelected = selectedIds.length > 0 && !allSelected;

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelectAll?.(e.target.checked);
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        onSelectRow?.(id, checked);
    };

    if (installers.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-neutral/10 overflow-hidden">
                <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <i className="fa-solid fa-users-slash text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No se encontraron instaladores</h3>
                    <p className="text-gray-500 text-sm mt-1">Ajusta los filtros o agrega un nuevo técnico.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-neutral/10 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-neutral font-bold text-xs uppercase tracking-wider border-b border-gray-100">
                        <tr>
                            <th className="p-4 w-10 text-center">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(input) => {
                                        if (input) {
                                            input.indeterminate = someSelected;
                                        }
                                    }}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                                />
                            </th>
                            <th className="p-4">Nombre</th>
                            <th className="p-4">Teléfono</th>
                            <th className="p-4">Estado</th>
                            <th className="p-4">Cuadrilla</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {installers.map((installer) => (
                            <tr
                                key={installer.id}
                                className="hover:bg-blue-50/30 transition-colors group"
                            >
                                <td className="p-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(installer.id)}
                                        onChange={(e) => handleSelectRow(installer.id, e.target.checked)}
                                        className="w-4 h-4 text-primary bg-white border-gray-300 rounded focus:ring-primary focus:ring-2 cursor-pointer"
                                    />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                            {installer.name.substring(0, 1)}
                                            {installer.surname.substring(0, 1)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-dark text-sm">
                                                {installer.name} {installer.surname}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">{installer.phone}</td>
                                <td className="p-4">
                                    <InstallerStatusBadge status={installer.status} />
                                </td>
                                <td className="p-4 text-sm">
                                    <InstallerCrewBadge crewName={installer.currentCrew} />
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 transition-opacity">
                                        <button
                                            onClick={() => onEdit?.(installer)}
                                            className="text-gray-400 hover:text-primary p-1 cursor-pointer"
                                            title="Editar"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete?.(installer)}
                                            className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                                            title="Eliminar"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
