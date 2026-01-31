import React, { forwardRef } from 'react';
import { CrewVisitsData } from '@/types/reportTypes';
import netunoLogo from '../orders/assets/netuno_logo.png';

interface CrewVisitsReportCardProps {
    data: CrewVisitsData[];
    dateRange: { start: string; end: string };
}

export const CrewVisitsReportCard = forwardRef<HTMLDivElement, CrewVisitsReportCardProps>(
    ({ data, dateRange }, ref) => {
        // Calculate total visits across all crews
        const totalVisits = data.reduce((acc, crew) => acc + crew.totalVisits, 0);
        const totalOrders = data.reduce((acc, crew) => acc + crew.orderCount, 0);
        const maxVisits = Math.max(...data.map(c => c.totalVisits), 1);

        // Colors constants (HEX for functionality)
        const colors = {
            primary: '#3e78b2',
            white: '#ffffff',
            gray50: '#f9fafb',
            gray100: '#f3f4f6',
            gray200: '#e5e7eb',
            gray300: '#d1d5db',
            gray400: '#9ca3af',
            gray500: '#6b7280',
            gray600: '#4b5563',
            gray700: '#374151',
            gray800: '#1f2937',
            green600: '#16a34a',
            blue600: '#2563eb',
            black: '#000000',
        };

        return (
            <div
                ref={ref}
                className="p-6 w-[800px] mx-auto font-sans"
                style={{ backgroundColor: colors.white, color: colors.black }}
            >
                {/* HEADER */}
                <div
                    className="flex justify-between items-start pb-3 mb-4"
                    style={{ borderBottom: `2px solid ${colors.primary}` }}
                >
                    <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={netunoLogo.src}
                            alt="Netuno Logo"
                            width={126}
                            height={126}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold" style={{ color: colors.gray800 }}>
                            REPORTE DE VISITAS POR CUADRILLA
                        </h2>
                        <p className="text-sm mt-1" style={{ color: colors.gray600 }}>
                            Período: {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.primary }}>
                            Generado: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div
                        className="p-4 rounded-lg"
                        style={{
                            backgroundColor: colors.primary,
                            color: colors.white
                        }}
                    >
                        <div className="text-sm uppercase tracking-wide opacity-90">Total Visitas</div>
                        <div className="text-4xl font-bold mt-1">{totalVisits}</div>
                    </div>
                    <div
                        className="p-4 rounded-lg"
                        style={{
                            backgroundColor: colors.gray100,
                            border: `2px solid ${colors.gray300}`
                        }}
                    >
                        <div className="text-sm uppercase tracking-wide" style={{ color: colors.gray600 }}>
                            Total Órdenes
                        </div>
                        <div className="text-4xl font-bold mt-1" style={{ color: colors.gray800 }}>
                            {totalOrders}
                        </div>
                    </div>
                </div>

                {/* CREWS LIST */}
                <div>
                    <h3
                        className="text-base font-bold uppercase mb-3 pb-2"
                        style={{
                            color: colors.primary,
                            borderBottom: `1px solid ${colors.gray200}`
                        }}
                    >
                        Detalle por Cuadrilla
                    </h3>

                    <div className="space-y-3">
                        {data.map((crew, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-lg"
                                style={{
                                    backgroundColor: colors.gray50,
                                    border: `1px solid ${colors.gray200}`
                                }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <div className="font-bold text-base" style={{ color: colors.gray800 }}>
                                            {crew.crewName}
                                        </div>
                                        <div className="text-xs mt-1" style={{ color: colors.gray500 }}>
                                            Total: {crew.orderCount} órdenes procesadas
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div
                                            className="text-3xl font-bold"
                                            style={{ color: colors.primary }}
                                        >
                                            {crew.totalVisits}
                                        </div>
                                        <div className="text-xs" style={{ color: colors.gray500 }}>
                                            visitas
                                        </div>
                                    </div>
                                </div>

                                {/* Order type breakdown */}
                                <div className="grid grid-cols-4 gap-2 mt-2 mb-2">
                                    <div
                                        className="text-center py-1.5 rounded"
                                        style={{ backgroundColor: colors.blue600 + '15', border: `1px solid ${colors.blue600}40` }}
                                    >
                                        <div className="text-xs font-semibold" style={{ color: colors.blue600 }}>
                                            {crew.instalaciones}
                                        </div>
                                        <div className="text-[10px]" style={{ color: colors.gray600 }}>
                                            Instalaciones
                                        </div>
                                    </div>
                                    <div
                                        className="text-center py-1.5 rounded"
                                        style={{ backgroundColor: '#ef4444' + '15', border: '1px solid #ef444440' }}
                                    >
                                        <div className="text-xs font-semibold" style={{ color: '#ef4444' }}>
                                            {crew.averias}
                                        </div>
                                        <div className="text-[10px]" style={{ color: colors.gray600 }}>
                                            Averías
                                        </div>
                                    </div>
                                    <div
                                        className="text-center py-1.5 rounded"
                                        style={{ backgroundColor: colors.green600 + '15', border: `1px solid ${colors.green600}40` }}
                                    >
                                        <div className="text-xs font-semibold" style={{ color: colors.green600 }}>
                                            {crew.recuperaciones}
                                        </div>
                                        <div className="text-[10px]" style={{ color: colors.gray600 }}>
                                            Recuperaciones
                                        </div>
                                    </div>
                                    <div
                                        className="text-center py-1.5 rounded"
                                        style={{ backgroundColor: colors.gray400 + '15', border: `1px solid ${colors.gray400}40` }}
                                    >
                                        <div className="text-xs font-semibold" style={{ color: colors.gray600 }}>
                                            {crew.otros}
                                        </div>
                                        <div className="text-[10px]" style={{ color: colors.gray600 }}>
                                            Otros
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div
                                    className="w-full h-2 rounded-full mt-2"
                                    style={{ backgroundColor: colors.gray200 }}
                                >
                                    <div
                                        className="h-2 rounded-full"
                                        style={{
                                            width: `${(crew.totalVisits / maxVisits) * 100}%`,
                                            backgroundColor: colors.primary
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {data.length === 0 && (
                        <div
                            className="text-center py-8 rounded-lg"
                            style={{
                                backgroundColor: colors.gray50,
                                border: `1px dashed ${colors.gray300}`
                            }}
                        >
                            <p className="text-sm italic" style={{ color: colors.gray500 }}>
                                No hay datos de visitas en el período seleccionado
                            </p>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div
                    className="mt-6 pt-3 text-center text-xs"
                    style={{
                        borderTop: `1px solid ${colors.gray200}`,
                        color: colors.gray400
                    }}
                >
                    <p>ENLARED Web Platform • Sistema de Gestión de Órdenes</p>
                </div>
            </div>
        );
    }
);

CrewVisitsReportCard.displayName = 'CrewVisitsReportCard';
