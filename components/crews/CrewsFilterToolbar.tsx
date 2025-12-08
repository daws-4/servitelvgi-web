"use client";

import React from "react";

interface CrewsFilterToolbarProps {
    searchQuery: string;
    statusFilter: string;
    onSearchChange: (query: string) => void;
    onStatusFilterChange: (status: string) => void;
    onNewCrew: () => void;
}

export const CrewsFilterToolbar: React.FC<CrewsFilterToolbarProps> = ({
    searchQuery,
    statusFilter,
    onSearchChange,
    onStatusFilterChange,
    onNewCrew,
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            {/* Search & Select Filters */}
            <div className="flex flex-1 w-full md:w-auto gap-3">
                {/* Search Input */}
                <div className="relative w-full md:w-72">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="fa-solid fa-magnifying-glass text-neutral text-sm"></i>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar cuadrilla, líder..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary text-sm bg-white placeholder-neutral/70 shadow-sm transition-all"
                    />
                </div>

                {/* Status Filter */}
                <div className="relative w-40 hidden sm:block">
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 rounded-lg border border-neutral/30 focus:border-primary focus:ring-1 focus:ring-primary text-sm bg-white shadow-sm appearance-none cursor-pointer text-dark"
                    >
                        <option value="all">Todos</option>
                        <option value="active">Activas</option>
                        <option value="inactive">Inactivas</option>
                    </select>
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-neutral">
                        <i className="fa-solid fa-chevron-down text-xs"></i>
                    </span>
                </div>
            </div>

            {/* Add Button */}
            <button
                onClick={onNewCrew}
                className="bg-primary hover:bg-secondary text-white px-5 py-2 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2 text-sm font-medium whitespace-nowrap"
            >
                <i className="fa-solid fa-plus"></i>
                Nueva Cuadrilla
            </button>
        </div>
    );
};
