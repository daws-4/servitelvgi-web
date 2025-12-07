"use client";

import React from "react";

interface InstallersFilterToolbarProps {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    statusFilter?: string;
    onStatusChange?: (value: string) => void;
    crewFilter?: string;
    onCrewChange?: (value: string) => void;
    crews?: any[];
    totalCount?: number;
}

export const InstallersFilterToolbar: React.FC<InstallersFilterToolbarProps> = ({
    searchValue = "",
    onSearchChange,
    statusFilter = "all",
    onStatusChange,
    crewFilter = "all",
    onCrewChange,
    crews = [],
    totalCount = 0,
}) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral/10 mb-6 flex flex-col md:flex-row items-end gap-4">
            {/* Search Input */}
            <div className="w-full md:w-1/3">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                    Buscar Técnico
                </label>
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                    <input
                        type="text"
                        placeholder="Nombre o Teléfono..."
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-1/4">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                    Estado
                </label>
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange?.(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                        <option value="all">Todos</option>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none"></i>
                </div>
            </div>

            {/* Crew Filter */}
            <div className="w-full md:w-1/4">
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">
                    Cuadrilla
                </label>
                <div className="relative">
                    <select
                        value={crewFilter}
                        onChange={(e) => onCrewChange?.(e.target.value)}
                        className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                        <option value="all">Todas</option>
                        {crews.map((crew) => (
                            <option key={crew._id} value={crew.name}>
                                {crew.name}
                            </option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none"></i>
                </div>
            </div>

            {/* Count Display */}
            <div className="text-xs text-gray-400 pb-2 md:ml-auto">
                Total: <span className="font-bold text-dark">{totalCount}</span> técnicos
            </div>
        </div>
    );
};
