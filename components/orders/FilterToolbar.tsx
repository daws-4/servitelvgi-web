"use client";

import React, { useState, useEffect } from "react";
import { FormInput } from "@/components/interactiveForms/Input";
import { FormSelect, SelectOption } from "@/components/interactiveForms/Select";
import { FormButton } from "@/components/interactiveForms/Button";
import { DateFilter } from "@/components/interactiveForms/DateRangePicker";

interface FilterToolbarProps {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    statusFilter?: string;
    onStatusChange?: (value: string) => void;
    typeFilter?: string;
    onTypeChange?: (value: string) => void;
    createdAtRange?: { start: string; end: string } | null;
    onCreatedAtRangeChange?: (range: { start: string; end: string } | null) => void;
    updatedAtRange?: { start: string; end: string } | null;
    onUpdatedAtRangeChange?: (range: { start: string; end: string } | null) => void;
    completionDateRange?: { start: string; end: string } | null;
    onCompletionDateRangeChange?: (range: { start: string; end: string } | null) => void;
    crewFilter?: string;
    onCrewChange?: (value: string) => void;
    isSentFilter?: string;
    onIsSentChange?: (value: string) => void;
    onNewOrder?: () => void;
}

const statusOptions: SelectOption[] = [
    { key: "all", label: "Estado: Todos" },
    { key: "pending", label: "Pendiente" },
    { key: "assigned", label: "Asignada" },
    { key: "in_progress", label: "En Progreso" },
    { key: "completed", label: "Completada" },
    { key: "cancelled", label: "Cancelada" },
    { key: "hard", label: "Hard" },
    { key: "visita", label: "Visita" },
];

const typeOptions: SelectOption[] = [
    { key: "all", label: "Tipo: Todos" },
    { key: "instalacion", label: "Instalación" },
    { key: "averia", label: "Avería" },
    { key: "recuperacion", label: "Recuperación" },
    { key: "otro", label: "Otro" },
];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
    searchValue = "",
    onSearchChange,
    statusFilter = "all",
    onStatusChange,
    typeFilter = "all",
    onTypeChange,
    createdAtRange = null,
    onCreatedAtRangeChange,
    updatedAtRange = null,
    onUpdatedAtRangeChange,
    completionDateRange = null,
    onCompletionDateRangeChange,
    crewFilter = "all",
    onCrewChange,
    isSentFilter = "all",
    onIsSentChange,
    onNewOrder,
}) => {
    const [crews, setCrews] = useState<{ _id: string; number: number; leader?: { name: string; surname: string } }[]>([]);

    // Load crews on mount
    useEffect(() => {
        const loadCrews = async () => {
            try {
                const res = await fetch('/api/web/crews');
                if (res.ok) {
                    const data = await res.json();
                    setCrews(data);
                }
            } catch (error) {
                console.error('Error loading crews:', error);
            }
        };

        loadCrews();
    }, []);

    return (
        <div className="flex flex-col gap-4 mb-6">
            {/* Primera fila: Filtros principales */}
            <div className="flex flex-wrap gap-3 items-end">
                {/* Buscador Principal */}
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"></i>
                    <input
                        type="text"
                        placeholder="Buscar abonado, nombre, ticket..."
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary w-64 shadow-sm h-10"
                    />
                </div>

                {/* Filtro Estado */}
                <div className="relative">
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusChange?.(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm cursor-pointer h-10"
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
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm cursor-pointer h-10"
                    >
                        {typeOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none"></i>
                </div>

                {/* Filtro Cuadrilla */}
                <div className="relative">
                    <select
                        value={crewFilter}
                        onChange={(e) => onCrewChange?.(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm cursor-pointer h-10"
                    >
                        <option value="all">Cuadrilla: Todas</option>
                        {crews.map(crew => (
                            <option key={crew._id} value={crew._id}>
                                Cuadrilla {crew.number}{crew.leader ? ` (${crew.leader.name} ${crew.leader.surname})` : ''}
                            </option>
                        ))}
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none"></i>
                </div>

                {/* Filtro IsSent */}
                <div className="relative">
                    <select
                        value={isSentFilter}
                        onChange={(e) => onIsSentChange?.(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-4 pr-8 rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm cursor-pointer h-10"
                    >
                        <option value="all">Netuno: Todos</option>
                        <option value="true">Enviado</option>
                        <option value="false">No Enviado</option>
                    </select>
                    <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none"></i>
                </div>
            </div>

            {/* Segunda fila: Filtros de Rango de Fechas */}
            <div className="flex flex-wrap gap-3 items-end">
                {/* Filtro Fecha de Asignación (createdAt) */}
                <div className="w-72">
                    <DateFilter
                        label="Fecha de Asignación"
                        onDateChange={onCreatedAtRangeChange}
                        value={createdAtRange}
                        labelPlacement="outside"
                        classNames={{
                            base: "w-full",
                            inputWrapper: "h-10",
                        }}
                    />
                </div>

                {/* Filtro Fecha de Última Edición (updatedAt) */}
                <div className="w-72">
                    <DateFilter
                        label="Fecha de Última Edición"
                        onDateChange={onUpdatedAtRangeChange}
                        value={updatedAtRange}
                        labelPlacement="outside"
                        classNames={{
                            base: "w-full",
                            inputWrapper: "h-10",
                        }}
                    />
                </div>

                {/* Filtro Fecha de Completación (completionDate) */}
                <div className="w-72">
                    <DateFilter
                        label="Fecha de Finalización"
                        onDateChange={onCompletionDateRangeChange}
                        value={completionDateRange}
                        labelPlacement="outside"
                        classNames={{
                            base: "w-full",
                            inputWrapper: "h-10",
                        }}
                    />
                </div>

                {/* Botón para reiniciar fechas */}
                {(createdAtRange || updatedAtRange || completionDateRange) && (
                    <button
                        onClick={() => {
                            onCreatedAtRangeChange?.(null);
                            onUpdatedAtRangeChange?.(null);
                            onCompletionDateRangeChange?.(null);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 cursor-pointer h-10"
                        title="Reiniciar filtros de fecha"
                    >
                        <i className="fa-solid fa-rotate-left"></i> Reiniciar Fechas
                    </button>
                )}
            </div>

            {/* Tercera fila: Botón Nueva Orden */}
            <div className="flex justify-end">
                <button
                    onClick={onNewOrder}
                    className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                    <i className="fa-solid fa-plus "></i> Nueva Orden
                </button>
            </div>
        </div>
    );
};

