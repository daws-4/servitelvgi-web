// app/dashboard/reports/components/ReportFilters.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Card } from "@heroui/card";
import DateFilter from "@/components/interactiveForms/DateRangePicker"; // Asegúrate de la ruta correcta
import type { ReportFilters as IReportFilters, ReportType } from "@/types/reportTypes";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface ReportFiltersProps {
    onGenerate: (filters: IReportFilters) => void;
    isLoading: boolean;
}

const REPORT_OPTIONS: { value: ReportType; label: string; icon: string }[] = [
    { value: "daily_installations", label: "Diario - Instalaciones", icon: "fa-wrench" },
    { value: "daily_repairs", label: "Diario - Averías", icon: "fa-screwdriver-wrench" },
    { value: "monthly_installations", label: "Mensual - Instalaciones", icon: "fa-calendar-check" },
    { value: "monthly_repairs", label: "Mensual - Averías", icon: "fa-calendar-xmark" },
    { value: "inventory_report", label: "Movimiento de Inventario", icon: "fa-boxes-stacked" },
    { value: "netuno_orders", label: "Órdenes Netuno Pendientes", icon: "fa-file-export" },
    { value: "crew_performance", label: "Rendimiento Cuadrillas", icon: "fa-chart-line" },
    { value: "crew_inventory", label: "Inventario Cuadrillas", icon: "fa-clipboard-list" },
];

export default function ReportFilters({ onGenerate, isLoading }: ReportFiltersProps) {
    const [selectedType, setSelectedType] = useState<ReportType | "">("");
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
    const [crewId, setCrewId] = useState<string>("");
    const [crews, setCrews] = useState<{ id: string; name: string }[]>([]);

    // Cargar cuadrillas al montar (para filtros opcionales)
    useEffect(() => {
        fetch("/api/web/crews")
            .then((res) => res.json())
            .then((data) => {
                if (data && Array.isArray(data)) {
                    setCrews(data.map((c: any) => ({ id: c._id, name: `Cuadrilla ${c.number}` })));
                }
            })
            .catch((err) => console.error("Error cargando cuadrillas:", err));
    }, []);

    const handleGenerate = () => {
        if (!selectedType) return;
        if (!dateRange && !["crew_inventory"].includes(selectedType)) return;

        // Lógica para fechas por defecto si es necesario
        const filters: IReportFilters = {
            reportType: selectedType as ReportType,
            startDate: dateRange?.start || format(new Date(), "yyyy-MM-dd"),
            endDate: dateRange?.end || format(new Date(), "yyyy-MM-dd"),
            crewId: crewId || undefined,
        };

        onGenerate(filters);
    };

    const isFormValid = () => {
        if (!selectedType) return false;
        // crew_inventory no requiere fechas obligatoriamente, pero si las tiene mejor
        // netuno_orders requiere fechas
        // daily/monthly requieren fechas (startDate)
        if (selectedType === "crew_inventory") return true;
        return !!dateRange;
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Selector de Tipo */}
                <div className="w-full">
                    <label className="block text-xs font-semibold text-[#bcabae] uppercase mb-1 ml-1">
                        Tipo de Reporte
                    </label>
                    <Select
                        placeholder="Seleccionar tipo..."
                        selectedKeys={selectedType ? [selectedType] : []}
                        onChange={(e) => setSelectedType(e.target.value as ReportType)}
                        className="w-full"
                        classNames={{
                            trigger: "bg-white border border-[#bcabae]/30 shadow-none data-[hover=true]:border-[#3e78b2]",
                        }}
                        startContent={<i className={`fa-solid ${selectedType ? REPORT_OPTIONS.find(o => o.value === selectedType)?.icon : 'fa-file-lines'} text-[#3e78b2]`}></i>}
                    >
                        {REPORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} textValue={option.label}>
                                <div className="flex items-center gap-2">
                                    <i className={`fa-solid ${option.icon} text-[#3e78b2] w-6 text-center`}></i>
                                    <span>{option.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </Select>
                </div>

                {/* Selector de Fechas */}
                <div className="w-full">
                    <DateFilter
                        label="Rango de Fechas"
                        onDateChange={setDateRange}
                        fullWidth
                        isDisabled={isLoading}
                    />
                </div>

                {/* Selector de Cuadrilla (Opcional) */}
                <div className="w-full">
                    <label className="block text-xs font-semibold text-[#bcabae] uppercase mb-1 ml-1">
                        Cuadrilla (Opcional)
                    </label>
                    <Select
                        placeholder="Todas las cuadrillas"
                        selectedKeys={crewId ? [crewId] : []}
                        onChange={(e) => setCrewId(e.target.value)}
                        className="w-full"
                        classNames={{
                            trigger: "bg-white border border-[#bcabae]/30 shadow-none data-[hover=true]:border-[#3e78b2]",
                        }}
                        startContent={<i className="fa-solid fa-users text-[#3e78b2]"></i>}
                    >
                        {crews.map((crew) => (
                            <SelectItem key={crew.id} textValue={crew.name}>
                                {crew.name}
                            </SelectItem>
                        ))}
                    </Select>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#bcabae]/10">
                <Button
                    onPress={handleGenerate}
                    isLoading={isLoading}
                    isDisabled={!isFormValid()}
                    className="bg-[#3e78b2] text-white font-medium shadow-md hover:bg-[#004ba8]"
                    startContent={!isLoading && <i className="fa-solid fa-bolt"></i>}
                >
                    Generar Reporte
                </Button>
            </div>
        </div>
    );
}
