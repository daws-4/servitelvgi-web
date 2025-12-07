"use client";

import React from "react";
import { FormInput } from "@/components/interactiveForms/Input";
import { FormSelect, SelectOption } from "@/components/interactiveForms/Select";
import { FormButton } from "@/components/interactiveForms/Button";

interface FilterToolbarProps {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    statusFilter?: string;
    onStatusChange?: (value: string) => void;
    typeFilter?: string;
    onTypeChange?: (value: string) => void;
    startDate?: string;
    onStartDateChange?: (value: string) => void;
    endDate?: string;
    onEndDateChange?: (value: string) => void;
    onNewOrder?: () => void;
}

const statusOptions: SelectOption[] = [
    { key: "all", label: "Estado: Todos" },
    { key: "pending", label: "Pendiente" },
    { key: "assigned", label: "Asignada" },
    { key: "in_progress", label: "En Progreso" },
    { key: "completed", label: "Completada" },
    { key: "cancelled", label: "Cancelada" },
];

const typeOptions: SelectOption[] = [
    { key: "all", label: "Tipo: Todos" },
    { key: "instalacion", label: "Instalación" },
    { key: "averia", label: "Avería" },
    { key: "otro", label: "Otro" },
];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
    searchValue = "",
    onSearchChange,
    statusFilter = "all",
    onStatusChange,
    typeFilter = "all",
    onTypeChange,
    startDate = "",
    onStartDateChange,
    endDate = "",
    onEndDateChange,
    onNewOrder,
}) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            {/* Filtros */}
            <div className="flex flex-wrap gap-3">
                {/* Buscador Principal */}
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
                    <input
                        type="text"
                        placeholder="Buscar abonado, nombre..."
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary w-64 shadow-sm"
                    />
                </div>

                {/* Filtro Estado */}
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange?.(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm cursor-pointer"
                    >
                        {statusOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none"></i>
                </div>

                {/* Filtro Tipo */}
                <div className="relative">
                    <select
                        value={typeFilter}
                        onChange={(e) => onTypeChange?.(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm cursor-pointer"
                    >
                        {typeOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none"></i>
                </div>

                {/* Filtro Fecha Inicio */}
                <div className="relative">
                    <i className="fa-solid fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartDateChange?.(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm cursor-pointer"
                        placeholder="Desde"
                    />
                </div>

                {/* Filtro Fecha Fin */}
                <div className="relative">
                    <i className="fa-solid fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange?.(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm cursor-pointer"
                        placeholder="Hasta"
                    />
                </div>
            </div>

            {/* Acciones Principales */}
            <button
                onClick={onNewOrder}
                className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer"
            >
                <i className="fa-solid fa-plus "></i> Nueva Orden
            </button>
        </div>
    );
};
