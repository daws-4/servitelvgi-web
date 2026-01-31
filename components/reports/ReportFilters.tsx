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
    { value: "crew_visits", label: "Visitas por Cuadrilla", icon: "fa-clipboard-check" },
];

export default function ReportFilters({ onGenerate, isLoading }: ReportFiltersProps) {
    const [selectedType, setSelectedType] = useState<ReportType | "">("");
    const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>(""); // Revertido a vacío inicial
    const [crewId, setCrewId] = useState<string>("");
    const [crews, setCrews] = useState<{ id: string; name: string }[]>([]);

    // Establecer mes actual por defecto al seleccionar reporte mensual
    useEffect(() => {
        if (['monthly_installations', 'monthly_repairs'].includes(selectedType) && !selectedMonth) {
            setSelectedMonth(format(new Date(), 'yyyy-MM'));
        }
    }, [selectedType, selectedMonth]);

    // Establecer rango de fechas del mes actual para crew_visits, crew_performance, y otros reportes de rango
    useEffect(() => {
        if (['crew_visits', 'crew_performance', 'inventory_report', 'netuno_orders'].includes(selectedType) && !dateRange) {
            const now = new Date();
            const start = startOfMonth(now);
            const end = endOfMonth(now);
            setDateRange({
                start: format(start, 'yyyy-MM-dd'),
                end: format(end, 'yyyy-MM-dd')
            });
        }
    }, [selectedType, dateRange]);

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

        // Validaciones por tipo de reporte
        const isMonthly = ['monthly_installations', 'monthly_repairs'].includes(selectedType);
        const isDaily = ['daily_installations', 'daily_repairs'].includes(selectedType);
        const needsDate = !isDaily && !isMonthly && !['crew_inventory'].includes(selectedType);

        if (isMonthly && !selectedMonth) return;
        if (needsDate && !dateRange) return;

        // Preparar filtros
        let startDate = "";
        let endDate = "";

        if (isDaily) {
            // Daily reports no necesitan fechas - usan fecha actual
            const today = format(new Date(), "yyyy-MM-dd");
            startDate = today;
            endDate = today;
        } else if (isMonthly) {
            // Monthly reports usan selectedMonth
            startDate = selectedMonth;
            endDate = selectedMonth;
        } else {
            // Otros reportes usan date range
            startDate = dateRange?.start || format(new Date(), "yyyy-MM-dd");
            endDate = dateRange?.end || format(new Date(), "yyyy-MM-dd");
        }

        const filters: IReportFilters = {
            reportType: selectedType as ReportType,
            startDate,
            endDate,
            crewId: crewId || undefined,
        };

        console.log("[FE DEBUG] Generating Report with filters:", filters);
        console.log("[FE DEBUG] Selected Type:", selectedType);
        console.log("[FE DEBUG] Date Range:", startDate, endDate);

        onGenerate(filters);
    };

    const isFormValid = () => {
        if (!selectedType) return false;

        const isMonthly = ['monthly_installations', 'monthly_repairs'].includes(selectedType);
        const isDaily = ['daily_installations', 'daily_repairs'].includes(selectedType);

        if (isDaily) return true; // Daily no requiere validación de fechas
        if (isMonthly) return !!selectedMonth; // Monthly requiere mes seleccionado
        if (selectedType === "crew_inventory") return true;

        return !!dateRange; // Otros requieren dateRange
    };

    // Auto-generar reporte cuando cambien los filtros válidos
    useEffect(() => {
        const valid = isFormValid();
        console.log("[FE DEBUG] Auto-gen effect triggered:", {
            selectedType,
            selectedMonth,
            crewId,
            isValid: valid
        });

        if (valid) {
            handleGenerate();
        } else {
            console.log("[FE DEBUG] Form invalid, skipping generation");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedType, selectedMonth, dateRange, crewId]);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-6 items-start">
                {/* Selector de Tipo */}
                <div className="w-full sm:w-80">
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

                {/* Selector de Fechas - oculto para daily reports y monthly reports */}
                {selectedType && !['daily_installations', 'daily_repairs', 'monthly_installations', 'monthly_repairs'].includes(selectedType) && (
                    <div className="w-full sm:w-80">
                        <DateFilter
                            label="Rango de Fechas"
                            value={dateRange}
                            onDateChange={setDateRange}
                            fullWidth
                            isDisabled={isLoading}
                        />
                    </div>
                )}

                {/* Mensaje para reportes diarios */}
                {selectedType && ['daily_installations', 'daily_repairs'].includes(selectedType) && (
                    <div className="flex-1 min-w-0 max-w-2xl">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2 text-blue-700">
                                <i className="fas fa-info-circle mt-0.5 flex-shrink-0"></i>
                                <span className="text-sm font-medium leading-relaxed break-words">
                                    Mostrando datos del día actual: {format(new Date(), 'dd/MM/yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Selector de mes/año para reportes mensuales */}
                {selectedType && ['monthly_installations', 'monthly_repairs'].includes(selectedType) && (
                    <div className="w-full sm:w-80">
                        <label className="block text-xs font-semibold text-[#bcabae] uppercase mb-1 ml-1">
                            Mes y Año
                        </label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            max={format(new Date(), 'yyyy-MM')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3e78b2] focus:border-transparent"
                            disabled={isLoading}
                        />
                    </div>
                )}

                {/* Selector de Cuadrilla (Opcional) */}
                <div className="w-full sm:w-80">
                    <label className="block text-xs font-semibold text-[#bcabae] uppercase mb-1 ml-1">
                        Cuadrilla (Opcional)
                    </label>
                    <Select
                        placeholder="Todas las cuadrillas"
                        selectedKeys={crewId ? [crewId] : []}
                        onChange={(e) => setCrewId(e.target.value === "all" ? "" : e.target.value)}
                        className="w-full"
                        classNames={{
                            trigger: "bg-white border border-[#bcabae]/30 shadow-sm hover:border-[#3e78b2] transition-colors",
                        }}
                        startContent={<i className="fa-solid fa-users text-[#3e78b2]"></i>}
                    >
                        {[
                            { id: "all", name: "Todas las cuadrillas" },
                            ...crews
                        ].map((crew) => (
                            <SelectItem key={crew.id} textValue={crew.name}>
                                {crew.name}
                            </SelectItem>
                        ))}
                    </Select>
                </div>
            </div>
        </div>
    );
}
